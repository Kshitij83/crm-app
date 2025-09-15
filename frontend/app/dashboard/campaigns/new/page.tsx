'use client'

import { useState } from 'react'
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
  Users
} from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { RuleBuilder } from '@/components/ui/rule-builder'
import { MessageEditor } from '@/components/ui/message-editor'

export default function NewCampaignPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [importMethod, setImportMethod] = useState<'csv' | 'api' | 'manual' | ''>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
                      <Button className="w-full" onClick={goToNextStep}>
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
                    <Button className="w-full" onClick={goToNextStep}>
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
                  Define rules to segment your audience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RuleBuilder 
                  onSave={() => goToNextStep()}
                  onAiSuggest={(description) => {
                    // In a real app, this would call the API to generate rules based on the description
                    alert(`AI would generate rules based on: ${description}`);
                    goToNextStep();
                  }}
                />
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
                <MessageEditor 
                  onSave={(data) => {
                    // In a real app, this would save the campaign
                    console.log('Campaign data:', data);
                    router.push('/dashboard/campaigns');
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
          <span>{Math.round(progress)}% Complete</span>
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

