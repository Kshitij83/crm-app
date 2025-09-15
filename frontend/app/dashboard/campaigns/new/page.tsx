'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft,
  Upload,
  Database,
  Edit,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Globe,
  Users,
  Target,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RuleBuilder, RuleGroup } from '@/components/ui/rule-builder'
import { MessageEditor } from '@/components/ui/message-editor'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import * as React from 'react'

// Inline Textarea component
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

export default function NewCampaignPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState(1)
  const [importMethod, setImportMethod] = useState<'csv' | 'api' | 'manual' | ''>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('')
  
  // Segment creation state
  const [segmentName, setSegmentName] = useState('')
  const [aiDescription, setAiDescription] = useState('')
  const [isGeneratingRules, setIsGeneratingRules] = useState(false)
  const [ruleGroup, setRuleGroup] = useState<RuleGroup>({
    id: 'root',
    logicalOperator: 'and',
    rules: [],
    groups: []
  })
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<{
    totalCustomers: number;
    customers: any[];
  } | null>(null)
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null)

  // Fetch segments (for backward compatibility, will remove later)
  const { data: segmentsData, isLoading: isLoadingSegments } = useQuery({
    queryKey: ['segments'],
    queryFn: () => api.getSegments({ limit: 100 }),
    enabled: false, // Disabled as we're not using existing segments anymore
  })

  // Load saved segment data when the component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSegmentName = localStorage.getItem('campaign_segment_name');
      const savedSegmentRules = localStorage.getItem('campaign_segment_rules');
      
      if (savedSegmentName) {
        setSegmentName(savedSegmentName);
      }
      
      if (savedSegmentRules) {
        try {
          // This is just to check if the rules are valid JSON
          JSON.parse(savedSegmentRules);
        } catch (error) {
          console.error('Error parsing saved rules:', error);
        }
      }
    }
  }, []);

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (data: { 
      segmentName: string;
      segmentRules: any;
      messageText: string;
    }) => api.createCampaign(data),
    onSuccess: (data) => {
      toast.success('Campaign created successfully!')
      if (data.delivery) {
        toast.success(`Campaign sent to ${data.delivery.totalCustomers} customers with ${data.delivery.successRate.toFixed(1)}% success rate`)
      }
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      router.push('/dashboard/campaigns')
    },
    onError: (error: any) => {
      toast.error(`Failed to create campaign: ${error?.message || 'Unknown error'}`)
      console.error('Campaign creation error:', error)
    }
  })
  
  // Parse rules mutation for AI generation
  const parseRulesMutation = useMutation({
    mutationFn: (description: string) => api.parseRules(description),
    onSuccess: (data) => {
      try {
        const apiRules = data.rules;
        
        // Create a new RuleGroup based on the API response
        const newRuleGroup: RuleGroup = {
          id: 'root',
          logicalOperator: apiRules.operator.toLowerCase() as 'and' | 'or',
          rules: apiRules.rules.map((r: any, idx: number) => ({
            id: `rule-${Date.now()}-${idx}`,
            field: r.field,
            operator: mapApiOperatorToRuleBuilder(r.operator),
            value: r.value || ''
          })),
          groups: []
        };
        
        setRuleGroup(newRuleGroup);
        setIsGeneratingRules(false);
        
        // Show success toast
        toast.success('Rules generated successfully');
        
        // Trigger preview update
        previewRulesMutation.mutate(apiRules);
      } catch (error) {
        console.error('Error mapping API rules:', error);
        toast.error('Failed to process generated rules');
        setIsGeneratingRules(false);
      }
    },
    onError: (error: any) => {
      setIsGeneratingRules(false);
      
      // Check if it's a quota error
      if (error.message && (
          error.message.includes('quota') || 
          error.message.includes('429') || 
          error.message.includes('insufficient'))) {
        toast.error('AI API quota exceeded. Please try again later or create rules manually.');
      } else {
        toast.error('Failed to generate rules from description: ' + (error.message || 'Unknown error'));
      }
    },
  })

  // Preview rules mutation
  const previewRulesMutation = useMutation({
    mutationFn: (rules: any) => api.previewRules(rules),
    onSuccess: (data) => {
      setPreviewData(data)
      setPreviewLoading(false)
    },
    onError: () => {
      setPreviewLoading(false)
      toast.error('Failed to preview segment')
    },
  })

  // Helper functions to map between operator formats
  function mapApiOperatorToRuleBuilder(apiOperator: string): string {
    const operatorMap: Record<string, string> = {
      '>': 'greater_than',
      '<': 'less_than',
      '=': 'equals',
      '>=': 'greater_than',
      '<=': 'less_than',
      'contains': 'contains',
      'not_contains': 'not_contains',
      'is_null': 'equals',
      'is_not_null': 'not_equals'
    };
    
    return operatorMap[apiOperator] || apiOperator;
  }

  function mapRuleBuilderToApiOperator(ruleBuilderOperator: string): string {
    const operatorMap: Record<string, string> = {
      'greater_than': '>',
      'less_than': '<',
      'equals': '=',
      'not_equals': '!=',
      'contains': 'contains',
      'not_contains': 'not_contains',
      'starts_with': 'starts_with',
      'ends_with': 'ends_with'
    };
    
    return operatorMap[ruleBuilderOperator] || ruleBuilderOperator;
  }

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  // Mock function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Mock function to handle file upload
  const handleUpload = () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          // Move to next step after upload
          toast.success(`Successfully uploaded ${selectedFile.name}`)
          setTimeout(() => setCurrentStep(2), 500)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Function to convert the RuleBuilder format to API format
  function convertRuleGroupToApiFormat(group: RuleGroup): any {
    // Map the logical operator
    const operator = group.logicalOperator.toUpperCase();
    
    // Map the rules
    const rules = group.rules.map(rule => ({
      field: rule.field,
      operator: mapRuleBuilderToApiOperator(rule.operator),
      value: rule.value
    }));
    
    // Handle nested groups recursively
    if (group.groups.length > 0) {
      for (const nestedGroup of group.groups) {
        const nestedRules = convertRuleGroupToApiFormat(nestedGroup);
        rules.push({
          field: 'nestedGroup',
          operator: nestedRules.operator,
          value: JSON.stringify(nestedRules.rules)
        });
      }
    }
    
    return {
      operator,
      rules
    };
  }
  
  // Handler for AI rule generation
  const handleGenerateRules = () => {
    if (!aiDescription.trim()) {
      toast.error('Please enter a description')
      return
    }
    setIsGeneratingRules(true)
    parseRulesMutation.mutate(aiDescription)
  }

  // Handler for rule changes
  const handleRuleChange = (updatedRuleGroup: RuleGroup) => {
    setRuleGroup(updatedRuleGroup);
    
    // Trigger preview update with delay
    if (previewTimer) {
      clearTimeout(previewTimer);
    }
    
    setPreviewLoading(true);
    
    const timer = setTimeout(() => {
      const apiRules = convertRuleGroupToApiFormat(updatedRuleGroup);
      previewRulesMutation.mutate(apiRules);
    }, 1000);
    
    setPreviewTimer(timer);
  };

  // Handler for segment submission
  const handleSubmit = () => {
    if (!segmentName.trim()) {
      toast.error('Please enter a segment name')
      return
    }

    if (ruleGroup.rules.length === 0 && ruleGroup.groups.length === 0) {
      toast.error('Please add at least one rule')
      return
    }
    
    // Store the segment information in browser storage to persist between steps
    if (typeof window !== 'undefined') {
      localStorage.setItem('campaign_segment_name', segmentName);
      localStorage.setItem('campaign_segment_rules', JSON.stringify(convertRuleGroupToApiFormat(ruleGroup)));
    }
    
    // Go to next step
    goToNextStep();
  }
  
  // Handler for saving segment and continuing
  const handleSaveAndContinue = () => {
    handleSubmit();
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Your Customer Data</CardTitle>
                <CardDescription>
                  Choose how you want to import your customer data for segmentation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CSV Import Option */}
                  <Card 
                    className={`cursor-pointer hover:border-blue-300 transition-all ${importMethod === 'csv' ? 'border-2 border-blue-500 dark:border-blue-400' : ''}`}
                    onClick={() => setImportMethod('csv')}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                        <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-medium text-center">CSV Import</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                        Upload a CSV file with your customer data
                      </p>
                      {importMethod === 'csv' && (
                        <Badge className="mt-3 bg-blue-500">Selected</Badge>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* API Import Option */}
                  <Card 
                    className={`cursor-pointer hover:border-blue-300 transition-all ${importMethod === 'api' ? 'border-2 border-blue-500 dark:border-blue-400' : ''}`}
                    onClick={() => setImportMethod('api')}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                        <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-medium text-center">API Integration</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                        Connect to an existing data source
                      </p>
                      {importMethod === 'api' && (
                        <Badge className="mt-3 bg-blue-500">Selected</Badge>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Manual Entry Option */}
                  <Card 
                    className={`cursor-pointer hover:border-blue-300 transition-all ${importMethod === 'manual' ? 'border-2 border-blue-500 dark:border-blue-400' : ''}`}
                    onClick={() => setImportMethod('manual')}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-medium text-center">Use Existing Data</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                        Use your previously imported customers
                      </p>
                      {importMethod === 'manual' && (
                        <Badge className="mt-3 bg-blue-500">Selected</Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Import Method Details */}
                {importMethod === 'csv' && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-3">CSV File Upload</h3>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          Drop your CSV file here or click to browse
                        </p>
                        <Input
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          className="hidden"
                          id="csv-upload"
                        />
                        <Label 
                          htmlFor="csv-upload"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                        >
                          Select File
                        </Label>
                        {selectedFile && (
                          <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                            {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                          </p>
                        )}
                      </div>
                      
                      {selectedFile && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Upload Progress</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="h-2" />
                          
                          <Button 
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="w-full mt-2"
                          >
                            {isUploading ? 'Uploading...' : 'Upload & Continue'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {importMethod === 'api' && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-3">API Integration</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="api-url">API Endpoint URL</Label>
                        <Input id="api-url" placeholder="https://api.example.com/customers" />
                      </div>
                      <div>
                        <Label htmlFor="api-key">API Key (if required)</Label>
                        <Input id="api-key" type="password" placeholder="Your API key" />
                      </div>
                      <Button className="w-full" onClick={() => {
                        toast.success('Successfully connected to API')
                        goToNextStep()
                      }}>
                        Connect & Continue
                      </Button>
                    </div>
                  </div>
                )}
                
                {importMethod === 'manual' && (
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-3">Use Existing Data</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      You have <span className="font-bold">247</span> customers in your database that can be used for segmentation.
                    </p>
                    <Button className="w-full" onClick={() => {
                      toast.success('Using existing customer data')
                      goToNextStep()
                    }}>
                      Use Existing Data & Continue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Your Segment</CardTitle>
                <CardDescription>
                  Define rules to target specific customers for this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToPreviousStep}
                    className="flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Import
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Main Form */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                      <div>
                        <Label htmlFor="segment-name">Segment Name</Label>
                        <Input
                          id="segment-name"
                          value={segmentName}
                          onChange={(e) => setSegmentName(e.target.value)}
                          placeholder="e.g., High Value Customers"
                          className="mb-4"
                        />
                      </div>

                      {/* AI Rule Generation */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ai-description" className="flex items-center">
                            <Sparkles className="h-4 w-4 mr-1 text-purple-500" />
                            AI-Powered Rule Generation
                          </Label>
                          <Textarea
                            id="ai-description"
                            value={aiDescription}
                            onChange={(e) => setAiDescription(e.target.value)}
                            placeholder="e.g., customers who spent more than $2000 and haven't been active for 30 days"
                            className="min-h-[80px]"
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
                      </div>                    {/* Manual Rules */}
                    <div className="space-y-4">
                      <Label>Segment Rules</Label>
                      <RuleBuilder 
                        initialRuleGroup={ruleGroup}
                        onChange={handleRuleChange}
                        onSave={handleSubmit}
                        onAiSuggest={(description) => {
                          setAiDescription(description);
                          handleGenerateRules();
                        }}
                      />
                    </div>
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
                        <div className="text-center py-6">
                          {previewLoading ? (
                            <div className="flex flex-col items-center">
                              <div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mb-4"></div>
                              <p className="text-gray-500">Calculating audience size...</p>
                            </div>
                          ) : ruleGroup.rules.length === 0 && ruleGroup.groups.length === 0 ? (
                            <>
                              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-gray-500">Add rules to see preview</p>
                            </>
                          ) : previewData ? (
                            <div className="space-y-4">
                              <div className="h-20 w-20 mx-auto rounded-full flex items-center justify-center border-4 border-blue-100 bg-blue-50 mb-4">
                                <span className="text-blue-600 text-xl font-bold">{previewData.totalCustomers}</span>
                              </div>
                              <p className="text-gray-700 font-medium">
                                {previewData.totalCustomers === 0 
                                  ? "No customers match these criteria"
                                  : previewData.totalCustomers === 1
                                  ? "1 customer matches these criteria"
                                  : `${previewData.totalCustomers} customers match these criteria`}
                              </p>
                              {previewData.totalCustomers > 0 && (
                                <div className="mt-4 text-xs text-gray-500">
                                  <p>Sample matches:</p>
                                  <ul className="mt-2 text-left">
                                    {previewData.customers.slice(0, 3).map((customer, index) => (
                                      <li key={index} className="border-b border-gray-100 py-1">
                                        {customer.name} ({customer.email})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-gray-500">Waiting for preview...</p>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <Button
                            onClick={handleSaveAndContinue}
                            disabled={!segmentName.trim() || (ruleGroup.rules.length === 0 && ruleGroup.groups.length === 0)}
                            className="w-full"
                          >
                            Save Segment & Continue
                          </Button>
                          <Button
                            variant="outline"
                            onClick={goToPreviousStep}
                            className="w-full"
                          >
                            Back
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Your Campaign</CardTitle>
                <CardDescription>
                  Define your campaign message and schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={goToPreviousStep}
                    className="flex items-center"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Segment
                  </Button>
                </div>
                <MessageEditor 
                  segmentId={selectedSegmentId}
                  onSave={(data) => {
                    // Combine subject and message for the API call
                    let messageText = `Subject: ${data.subject}\n\n${data.message}`
                    
                    // Add scheduled date/time if provided
                    if (data.sendDate && data.sendTime) {
                      const scheduledDateTime = `${data.sendDate}T${data.sendTime}:00Z`
                      messageText += `\n\nScheduled for: ${scheduledDateTime}`
                    }
                    
                    // Get the saved segment data from localStorage
                    const savedSegmentName = localStorage.getItem('campaign_segment_name') || segmentName;
                    const savedSegmentRules = localStorage.getItem('campaign_segment_rules');
                    
                    if (!savedSegmentName) {
                      toast.error('No segment name found. Please go back and create a segment.')
                      return;
                    }
                    
                    if (!savedSegmentRules) {
                      toast.error('No segment rules found. Please go back and create segment rules.')
                      return;
                    }
                    
                    try {
                      // Parse the rules from localStorage
                      const parsedRules = JSON.parse(savedSegmentRules);
                      
                      // Call API to create campaign with embedded segment data
                      createCampaignMutation.mutate({
                        segmentName: savedSegmentName,
                        segmentRules: parsedRules,
                        messageText
                      });
                    } catch (error) {
                      console.error('Error parsing saved rules:', error);
                      toast.error('Error with segment rules. Please go back and recreate the segment.');
                    }
                  }}
                  onAiSuggest={() => {
                    // This is handled inside the MessageEditor component
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Campaign</h1>
            <p className="text-gray-600 dark:text-gray-400">Follow the steps to create your campaign</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Step {currentStep} of {totalSteps}</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step Indicators */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {currentStep > 1 ? <Check className="h-4 w-4" /> : 1}
            </div>
            <span className="text-xs mt-1">Import</span>
          </div>
          
          <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2"></div>
          
          <div className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {currentStep > 2 ? <Check className="h-4 w-4" /> : 2}
            </div>
            <span className="text-xs mt-1">Segment</span>
          </div>
          
          <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2"></div>
          
          <div className="flex flex-col items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              3
            </div>
            <span className="text-xs mt-1">Campaign</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  )
}

