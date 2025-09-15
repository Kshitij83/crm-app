'use client'

import { useState } from 'react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, SendHorizontal, Calendar, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
  onSave: (data: {
    subject: string;
    message: string;
    sendDate: string;
    sendTime: string;
  }) => void;
  onAiSuggest: () => void;
}

export function MessageEditor({ onSave, onAiSuggest }: MessageEditorProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sendDate, setSendDate] = useState('')
  const [sendTime, setSendTime] = useState('')
  const [aiMode, setAiMode] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const handleAiGenerate = () => {
    if (!aiPrompt) return
    
    setIsGenerating(true)
    
    // Simulate AI generation
    setTimeout(() => {
      // Example AI generated content
      setSubject('Special Offer for Valued Customers')
      setMessage(`Hi {customer.firstName},

We noticed you've been with us for {customer.loyaltyYears} years now, and we wanted to thank you for your continued support.

As a token of our appreciation, we're offering you a special 15% discount on your next purchase. Use code THANKS15 at checkout.

This offer is exclusive to our most valued customers like you and expires in 7 days.

Best regards,
The NexFluent Team`)
      
      setIsGenerating(false)
      setAiMode(false)
    }, 1500)
  }
  
  const handleSave = () => {
    onSave({
      subject,
      message,
      sendDate,
      sendTime
    })
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
          disabled={!subject || !message}
          className="flex items-center"
        >
          Save Campaign <SendHorizontal className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}