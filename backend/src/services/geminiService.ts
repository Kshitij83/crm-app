import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

// Initialize Gemini with API key
let geminiAI: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

if (process.env.GEMINI_API_KEY) {
  geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = geminiAI.getGenerativeModel({ model: MODEL_NAME });
} else {
  console.error('GEMINI_API_KEY not found in environment variables. Gemini features will be unavailable.');
}

// Error type definition for Gemini errors
interface GeminiError extends Error {
  status?: number;
  code?: string;
  type?: string;
}

// Helper function to check if an error is a quota error
function isQuotaError(error: any): boolean {
  return (
    error.code === 'RESOURCE_EXHAUSTED' || 
    error.message?.includes('quota') || 
    error.message?.includes('rate limit') || 
    error.status === 429
  );
}

export interface MessageSuggestionRequest {
  objective: string;
  targetAudience: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent';
  maxLength?: number;
}

export interface RuleParsingRequest {
  description: string;
}

export class GeminiService {
  static async generateMessageSuggestions(request: MessageSuggestionRequest): Promise<string[]> {
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

      if (!geminiModel) {
        throw new Error('Gemini API key not configured. Please check your environment variables.');
      }

      const generationConfig: GenerationConfig = {
        temperature: 0.8,
        maxOutputTokens: 500,
      };

      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const responseText = response.text();
      const messages = responseText.split('---').map(msg => msg.trim()).filter(msg => msg.length > 0);

      return messages.slice(0, 3);
    } catch (error) {
      console.error('Gemini message generation error:', error);
      
      if (isQuotaError(error)) {
        throw new Error('Gemini API quota exceeded. Please try again later or contact support.');
      }
      
      throw new Error(`Failed to generate message suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async parseNaturalLanguageRules(request: RuleParsingRequest): Promise<any> {
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

      if (!geminiModel) {
        throw new Error('Gemini API key not configured. Please check your environment variables.');
      }

      const generationConfig: GenerationConfig = {
        temperature: 0.3,
        maxOutputTokens: 300,
      };

      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const responseText = response.text();
      
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', responseText);
        throw new Error('Failed to parse the AI response into valid rules. Please try with a clearer description.');
      }
    } catch (error) {
      console.error('Gemini rule parsing error:', error);
      
      if (isQuotaError(error)) {
        throw new Error('Gemini API quota exceeded. Please try again later or contact support.');
      }
      
      throw new Error(`Failed to parse natural language rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async generateCampaignInsights(campaignData: any): Promise<string> {
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

      if (!geminiModel) {
        throw new Error('Gemini API key not configured. Please check your environment variables.');
      }

      const generationConfig: GenerationConfig = {
        temperature: 0.5,
        maxOutputTokens: 200,
      };

      const result = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      return response.text() || 'No insights available';
    } catch (error) {
      console.error('Gemini insights generation error:', error);
      
      if (isQuotaError(error)) {
        throw new Error('Gemini API quota exceeded. Please try again later or contact support.');
      }
      
      throw new Error(`Failed to generate campaign insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}