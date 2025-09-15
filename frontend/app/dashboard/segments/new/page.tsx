'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  Plus, 
  Trash2,
  Users,
  Sparkles,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Rule {
  id: string
  field: 'totalSpend' | 'visits' | 'lastActiveDate' | 'email' | 'name'
  operator: '>' | '<' | '=' | '>=' | '<=' | 'contains' | 'not_contains' | 'is_null' | 'is_not_null'
  value: string | number
}

export default function NewSegmentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [segmentName, setSegmentName] = useState('')
  const [rules, setRules] = useState<Rule[]>([])
  const [operator, setOperator] = useState<'AND' | 'OR'>('AND')
  const [aiDescription, setAiDescription] = useState('')
  const [isGeneratingRules, setIsGeneratingRules] = useState(false)

  const createSegmentMutation = useMutation({
    mutationFn: (data: { name: string; rules: any }) => api.createSegment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] })
      toast.success('Segment created successfully')
      router.push('/dashboard/segments')
    },
    onError: () => {
      toast.error('Failed to create segment')
    },
  })

  const parseRulesMutation = useMutation({
    mutationFn: (description: string) => api.parseRules(description),
    onSuccess: (data) => {
      // Convert AI rules to our format
      const newRules: Rule[] = data.rules.rules.map((rule: any, index: number) => ({
        id: `rule-${Date.now()}-${index}`,
        field: rule.field,
        operator: rule.operator,
        value: rule.value || '',
      }))
      setRules(newRules)
      setOperator(data.rules.operator)
      setIsGeneratingRules(false)
      toast.success('Rules generated successfully')
    },
    onError: () => {
      setIsGeneratingRules(false)
      toast.error('Failed to generate rules from description')
    },
  })

  const addRule = () => {
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      field: 'totalSpend',
      operator: '>',
      value: '',
    }
    setRules([...rules, newRule])
  }

  const updateRule = (id: string, updates: Partial<Rule>) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ))
  }

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id))
  }

  const handleGenerateRules = () => {
    if (!aiDescription.trim()) {
      toast.error('Please enter a description')
      return
    }
    setIsGeneratingRules(true)
    parseRulesMutation.mutate(aiDescription)
  }

  const handleSubmit = () => {
    if (!segmentName.trim()) {
      toast.error('Please enter a segment name')
      return
    }
    if (rules.length === 0) {
      toast.error('Please add at least one rule')
      return
    }

    const segmentRules = {
      operator,
      rules: rules.map(rule => ({
        field: rule.field,
        operator: rule.operator,
        value: rule.value,
      })),
    }

    createSegmentMutation.mutate({
      name: segmentName,
      rules: segmentRules,
    })
  }

  const fieldOptions = [
    { value: 'totalSpend', label: 'Total Spend' },
    { value: 'visits', label: 'Number of Visits' },
    { value: 'lastActiveDate', label: 'Last Active Date' },
    { value: 'email', label: 'Email' },
    { value: 'name', label: 'Name' },
  ]

  const operatorOptions = {
    totalSpend: [
      { value: '>', label: 'Greater than' },
      { value: '<', label: 'Less than' },
      { value: '>=', label: 'Greater than or equal' },
      { value: '<=', label: 'Less than or equal' },
      { value: '=', label: 'Equal to' },
    ],
    visits: [
      { value: '>', label: 'Greater than' },
      { value: '<', label: 'Less than' },
      { value: '>=', label: 'Greater than or equal' },
      { value: '<=', label: 'Less than or equal' },
      { value: '=', label: 'Equal to' },
    ],
    lastActiveDate: [
      { value: '<', label: 'Less than (days ago)' },
      { value: '>', label: 'Greater than (days ago)' },
      { value: 'is_null', label: 'Is null' },
      { value: 'is_not_null', label: 'Is not null' },
    ],
    email: [
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does not contain' },
    ],
    name: [
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does not contain' },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/segments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Segments
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Segment</h1>
            <p className="text-gray-600">Define rules to target specific customers</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Information</CardTitle>
              <CardDescription>
                Give your segment a name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Segment Name</Label>
                <Input
                  id="name"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  placeholder="e.g., High Value Customers"
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Rule Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                AI-Powered Rule Generation
              </CardTitle>
              <CardDescription>
                Describe your target audience in natural language
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ai-description">Description</Label>
                <Input
                  id="ai-description"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="e.g., customers who spent more than $2000 and haven't been active for 30 days"
                />
              </div>
              <Button
                onClick={handleGenerateRules}
                disabled={isGeneratingRules || !aiDescription.trim()}
                className="w-full"
              >
                {isGeneratingRules ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Generating Rules...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Rules with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Rules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Segment Rules</CardTitle>
                  <CardDescription>
                    Define the criteria for this segment
                  </CardDescription>
                </div>
                <Button onClick={addRule} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Operator Selection */}
              <div className="flex items-center space-x-4">
                <Label>Match rules with:</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={operator === 'AND' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOperator('AND')}
                  >
                    AND
                  </Button>
                  <Button
                    variant={operator === 'OR' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOperator('OR')}
                  >
                    OR
                  </Button>
                </div>
              </div>

              {/* Rules */}
              {rules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No rules added yet. Add rules to define your segment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule, index) => (
                    <div key={rule.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        {index > 0 && (
                          <span className="text-sm font-medium text-gray-500">
                            {operator}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <Label>Field</Label>
                          <select
                            value={rule.field}
                            onChange={(e) => updateRule(rule.id, { field: e.target.value as any })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          >
                            {fieldOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <Label>Operator</Label>
                          <select
                            value={rule.operator}
                            onChange={(e) => updateRule(rule.id, { operator: e.target.value as any })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          >
                            {operatorOptions[rule.field].map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <Label>Value</Label>
                          <Input
                            value={rule.value}
                            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                            placeholder={
                              rule.field === 'lastActiveDate' ? '30' :
                              rule.field === 'totalSpend' ? '2000' :
                              rule.field === 'visits' ? '5' :
                              'Enter value'
                            }
                            type={
                              rule.field === 'totalSpend' || rule.field === 'visits' || rule.field === 'lastActiveDate'
                                ? 'number'
                                : 'text'
                            }
                            disabled={rule.operator === 'is_null' || rule.operator === 'is_not_null'}
                          />
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                Preview
              </CardTitle>
              <CardDescription>
                See how many customers match your rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  {rules.length === 0 
                    ? 'Add rules to see preview'
                    : 'Click "Preview Segment" to see matching customers'
                  }
                </p>
                {rules.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      // In a real app, you'd call the preview API
                      toast.success('Preview feature coming soon!')
                    }}
                  >
                    Preview Segment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Button
                  onClick={handleSubmit}
                  disabled={createSegmentMutation.isPending || !segmentName.trim() || rules.length === 0}
                  className="w-full"
                >
                  {createSegmentMutation.isPending ? 'Creating...' : 'Create Segment'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/segments')}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

