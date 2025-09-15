'use client'

import { useState } from 'react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, SendHorizontal, Calendar, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import toast from 'react-hot-toast'

// Inline Textarea component to avoid import issues
const Textarea = React.forwardRef<
  HTMLTextAreaElement, 
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

interface MessageEditorProps {
  segmentId?: string;
  onSave: (data: {
    subject: string;
    message: string;
    sendDate: string;
    sendTime: string;
  }) => void;
  onAiSuggest: () => void;
}

export function MessageEditor({ segmentId, onSave, onAiSuggest }: MessageEditorProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sendDate, setSendDate] = useState('')
  const [sendTime, setSendTime] = useState('')
  const [aiMode, setAiMode] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const handleAiGenerate = async () => {
    if (!aiPrompt) return
    
    setIsGenerating(true)
    
    try {
      // Extract objective and target audience from the prompt
      const promptLines = aiPrompt.split('\n').filter(line => line.trim() !== '')
      const objective = promptLines[0] || aiPrompt
      const targetAudience = promptLines.length > 1 ? promptLines[1] : 'customers'
      
      // Determine tone based on prompt keywords
      let tone: 'professional' | 'casual' | 'friendly' | 'urgent' = 'professional'
      
      if (aiPrompt.toLowerCase().includes('urgent') || 
          aiPrompt.toLowerCase().includes('limited time') || 
          aiPrompt.toLowerCase().includes('hurry')) {
        tone = 'urgent'
      } else if (aiPrompt.toLowerCase().includes('casual') || 
                aiPrompt.toLowerCase().includes('relaxed')) {
        tone = 'casual'
      } else if (aiPrompt.toLowerCase().includes('friendly') || 
                aiPrompt.toLowerCase().includes('warm')) {
        tone = 'friendly'
      }
      
      // Call the API
      const response = await api.getMessageSuggestions({
        objective,
        targetAudience,
        tone,
        maxLength: 300
      })
      
      const { suggestions } = response;
      
      if (suggestions && suggestions.length > 0) {
        // Parse the first suggestion to extract subject and body
        const messageParts = suggestions[0].split('\n')
        let extractedSubject = ''
        let extractedBody = ''
        
        if (messageParts.length > 0) {
          // Try to extract subject from the first line
          if (messageParts[0].toLowerCase().startsWith('subject:')) {
            extractedSubject = messageParts[0].substring(8).trim()
            extractedBody = messageParts.slice(1).join('\n').trim()
          } else {
            // Use the first line as subject and the rest as body
            extractedSubject = messageParts[0]
            extractedBody = messageParts.slice(1).join('\n').trim()
          }
          
          setSubject(extractedSubject)
          setMessage(extractedBody || suggestions[0])
        } else {
          setMessage(suggestions[0])
        }
        
        toast.success('AI generated message successfully!')
      } else {
        toast.error('No suggestions were generated. Please try a different prompt.')
      }
    } catch (error) {
      console.error('Error generating AI message:', error)
      
      // Check if it's a quota error
      if (error instanceof Error && 
          (error.message.includes('quota') || 
           error.message.includes('429') || 
           error.message.includes('insufficient'))) {
        toast.error('AI API quota exceeded. Using fallback responses.')
      } else {
        toast.error('Failed to generate AI message. Please try again.')
      }
    } finally {
      setIsGenerating(false)
      setAiMode(false)
    }
  }
  
  const handleSave = () => {
    setIsSaving(true)
    
    // Combine subject and message for API call
    const fullMessage = `Subject: ${subject}\n\n${message}`
    
    // Call onSave with the data
    onSave({
      subject,
      message,
      sendDate,
      sendTime
    })
    
    setIsSaving(false)
  }
  
  if (aiMode) {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="ai-prompt">Describe your campaign message</Label>
          <div className="flex gap-2 mt-1">
            <Textarea
              id="ai-prompt"
              placeholder="E.g., Create a friendly email offering a 15% discount to customers who haven't made a purchase in the last 3 months. Include personalization and a sense of urgency."
              className="h-32 flex-1"
              value={aiPrompt}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiPrompt(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setAiMode(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAiGenerate}
            disabled={!aiPrompt || isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>Generating <Sparkles className="ml-2 h-4 w-4 animate-pulse" /></>
            ) : (
              <>Generate with AI <Sparkles className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="subject">Email Subject</Label>
        <Input
          id="subject"
          placeholder="Enter subject line"
          value={subject}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="message">Message Content</Label>
        <div className="relative mt-1">
          <Textarea
            id="message"
            placeholder="Write your message here. Use {customer.firstName}, {customer.lastName}, etc. for personalization."
            className="min-h-[200px]"
            value={message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2"
            onClick={() => setAiMode(true)}
          >
            <Sparkles className="h-4 w-4 mr-1" /> AI Assist
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="send-date">Send Date</Label>
          <div className="relative">
            <Input
              id="send-date"
              type="date"
              value={sendDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendDate(e.target.value)}
            />
            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div>
          <Label htmlFor="send-time">Send Time</Label>
          <div className="relative">
            <Input
              id="send-time"
              type="time"
              value={sendTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSendTime(e.target.value)}
            />
            <Clock className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      
      {(subject && message) && (
        <Card className="bg-gray-50 dark:bg-gray-800 border-dashed mt-4">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Preview</h3>
            <div className="bg-white dark:bg-gray-900 p-3 rounded-md border dark:border-gray-700">
              <div className="font-medium">{subject}</div>
              <div className="text-sm whitespace-pre-wrap mt-2 text-gray-700 dark:text-gray-300">
                {message.replace(/{customer\.firstName}/g, 'John')
                  .replace(/{customer\.lastName}/g, 'Smith')
                  .replace(/{customer\.loyaltyYears}/g, '2')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-end mt-4">
        <Button
          onClick={handleSave}
          disabled={!subject || !message || isSaving}
          className="flex items-center"
        >
          {isSaving ? 'Saving...' : 'Save Campaign'} <SendHorizontal className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}