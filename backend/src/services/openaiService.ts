import OpenAI from 'openai';

// Initialize OpenAI only if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Flag to determine if we should use mock responses
const USE_MOCK = !openai || process.env.NODE_ENV === 'development';

export interface MessageSuggestionRequest {
  objective: string;
  targetAudience: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent';
  maxLength?: number;
}

export interface RuleParsingRequest {
  description: string;
}

export class OpenAIService {
  static async generateMessageSuggestions(request: MessageSuggestionRequest): Promise<string[]> {
    if (USE_MOCK) {
      console.log('Using mock OpenAI response for message suggestions');
      const { objective, targetAudience, tone = 'professional' } = request;
      
      // Mock responses based on input parameters
      const mockResponses = {
        professional: [
          `Don't miss out on our exclusive offer for ${targetAudience}. ${objective}. Click now to learn more.`,
          `Special opportunity for our valued ${targetAudience}: ${objective}. Limited time offer!`,
          `As a member of our ${targetAudience} group, you now have access to: ${objective}. Act now!`
        ],
        casual: [
          `Hey there! Thought you'd like to know about this: ${objective}. Perfect for ${targetAudience} like you!`,
          `Check this out! We've got something special for ${targetAudience}: ${objective}. Don't miss it!`,
          `Hey! ${objective} - and it's perfect for ${targetAudience}! What do you think?`
        ],
        friendly: [
          `We're excited to share this with you! ${objective} - designed with ${targetAudience} in mind.`,
          `Hello from the team! We've created something special: ${objective}. Perfect for ${targetAudience}!`,
          `We think you'll love this! ${objective} - specially curated for ${targetAudience}.`
        ],
        urgent: [
          `LAST CHANCE: ${objective} - Exclusive to ${targetAudience}. Ends today!`,
          `24 HOURS LEFT: Don't miss ${objective} - created for ${targetAudience}!`,
          `URGENT: ${objective} - Limited availability for ${targetAudience}. Act now!`
        ]
      };
      
      return mockResponses[tone] || mockResponses.professional;
    }
    
    try {
      const { objective, targetAudience, tone = 'professional', maxLength = 160 } = request;

      const prompt = `
        Generate 3 different marketing message variations for the following campaign:
        
        Objective: ${objective}
        Target Audience: ${targetAudience}
        Tone: ${tone}
        Max Length: ${maxLength} characters
        
        Requirements:
        - Each message should be unique and compelling
        - Include a clear call-to-action
        - Match the specified tone
        - Stay within character limit
        - Make them actionable and engaging
        
        Return only the 3 messages, separated by "---"
      `;

      if (!openai) throw new Error('OpenAI API key not configured');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert marketing copywriter specializing in CRM campaigns and customer engagement.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.8,
      });

      const response = completion.choices[0]?.message?.content || '';
      const messages = response.split('---').map(msg => msg.trim()).filter(msg => msg.length > 0);

      return messages.slice(0, 3);
    } catch (error) {
      console.error('OpenAI message generation error:', error);
      throw new Error('Failed to generate message suggestions');
    }
  }

  static async parseNaturalLanguageRules(request: RuleParsingRequest): Promise<any> {
    if (USE_MOCK) {
      console.log('Using mock OpenAI response for rule parsing');
      const { description } = request;
      
      // Basic pattern matching to provide realistic mock responses
      if (description.includes('spent') || description.includes('purchase')) {
        return {
          "operator": "AND",
          "rules": [
            {
              "field": "totalSpend",
              "operator": ">",
              "value": "500"
            },
            {
              "field": "visits",
              "operator": ">",
              "value": "3"
            }
          ]
        };
      } else if (description.includes('inactive') || description.includes('days')) {
        return {
          "operator": "AND",
          "rules": [
            {
              "field": "lastActiveDate",
              "operator": "<",
              "value": "90"
            }
          ]
        };
      } else if (description.includes('email') || description.includes('contact')) {
        return {
          "operator": "OR",
          "rules": [
            {
              "field": "email",
              "operator": "contains",
              "value": "gmail.com"
            },
            {
              "field": "email",
              "operator": "contains",
              "value": "yahoo.com"
            }
          ]
        };
      } else {
        // Default rules
        return {
          "operator": "AND",
          "rules": [
            {
              "field": "totalSpend",
              "operator": ">",
              "value": "100"
            }
          ]
        };
      }
    }
    
    try {
      const { description } = request;

      const prompt = `
        Convert the following natural language description into structured JSON rules for customer segmentation:
        
        Description: "${description}"
        
        Return a JSON object with the following structure:
        {
          "operator": "AND" | "OR",
          "rules": [
            {
              "field": "totalSpend" | "visits" | "lastActiveDate" | "email" | "name",
              "operator": ">" | "<" | "=" | ">=" | "<=" | "contains" | "not_contains" | "is_null" | "is_not_null",
              "value": "any_value_or_null"
            }
          ]
        }
        
        Field mappings:
        - "spending" or "spent" → "totalSpend"
        - "visits" or "visit count" → "visits"
        - "inactive" or "last active" → "lastActiveDate"
        - "email" → "email"
        - "name" → "name"
        
        Operator mappings:
        - "greater than" or "more than" → ">"
        - "less than" or "fewer than" → "<"
        - "equals" or "is" → "="
        - "contains" → "contains"
        - "doesn't contain" → "not_contains"
        - "is empty" or "is null" → "is_null"
        - "is not empty" or "is not null" → "is_not_null"
        
        For date fields, use days as the unit (e.g., "90 days ago" → 90)
        For amount fields, use the number (e.g., "5000" → 5000)
        
        Return only the JSON object, no additional text.
      `;

      if (!openai) throw new Error('OpenAI API key not configured');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at converting natural language into structured data rules for customer segmentation.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', response);
        throw new Error('Invalid response format from AI service');
      }
    } catch (error) {
      console.error('OpenAI rule parsing error:', error);
      throw new Error('Failed to parse natural language rules');
    }
  }

  static async generateCampaignInsights(campaignData: any): Promise<string> {
    if (USE_MOCK) {
      console.log('Using mock OpenAI response for campaign insights');
      
      const successRate = campaignData.successRate || 0;
      
      if (successRate > 75) {
        return `This campaign performed exceptionally well with a ${successRate}% success rate, significantly above industry average. The messaging resonated strongly with the target segment. Consider expanding this approach to similar segments and testing slight variations to further optimize results.`;
      } else if (successRate > 50) {
        return `The campaign achieved a solid ${successRate}% success rate, showing good engagement with the target audience. To improve results, consider refining the message timing and testing more personalized content. Segment analysis suggests potential for higher conversion with adjustments.`;
      } else {
        return `The campaign's ${successRate}% success rate indicates room for improvement. The message may not have resonated with this particular segment. Consider revising the content approach, testing different value propositions, and reviewing the segment criteria to ensure better targeting.`;
      }
    }
    
    try {
      const prompt = `
        Analyze the following campaign performance data and provide insights:
        
        Campaign: ${campaignData.name || 'Unnamed Campaign'}
        Total Sent: ${campaignData.totalSent || 0}
        Success Rate: ${campaignData.successRate || 0}%
        Target Segment: ${campaignData.segmentName || 'Unknown'}
        Message: ${campaignData.messageText || 'No message'}
        
        Provide a brief analysis (2-3 sentences) with:
        1. Performance assessment
        2. Potential improvements
        3. Recommendations for future campaigns
        
        Keep it concise and actionable.
      `;

      if (!openai) throw new Error('OpenAI API key not configured');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a marketing analytics expert who provides actionable insights on campaign performance.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.5,
      });

      return completion.choices[0]?.message?.content || 'No insights available';
    } catch (error) {
      console.error('OpenAI insights generation error:', error);
      return 'Unable to generate insights at this time';
    }
  }
}

