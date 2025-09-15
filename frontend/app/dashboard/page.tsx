'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  PlusCircle,
  History,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateCampaign = () => {
    setIsCreating(true)
    router.push('/dashboard/campaigns/new')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-3 mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to <span className="text-blue-600 dark:text-blue-400">Nex</span><span className="text-blue-600 dark:text-blue-400">Fluent</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Create targeted campaigns with our visual rule builder and AI assistance
          </p>
        </div>

        {/* Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Campaign Card */}
          <Card className="border-2 border-blue-200 dark:border-blue-900 shadow-lg hover:shadow-xl transition-all cursor-pointer" onClick={handleCreateCampaign}>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <PlusCircle className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
                Create New Campaign
              </CardTitle>
              <CardDescription className="text-base">
                Start a new campaign with our step-by-step wizard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mr-3 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">1</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">Import or select your customer data</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mr-3 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">2</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">Build segments with our visual rule builder</p>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-1 mr-3 mt-0.5">
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">3</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">Create and schedule your campaign</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <Sparkles className="h-4 w-4 mr-1" />
                  <span className="text-sm">AI-assisted creation</span>
                </div>
                <Button variant="ghost" className="text-blue-600 dark:text-blue-400">
                  Get Started <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* View Past Campaigns Card */}
          <Card className="border border-gray-200 dark:border-gray-700 shadow hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/dashboard/campaigns')}>
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <History className="h-6 w-6 mr-2 text-gray-600 dark:text-gray-400" />
                View Past Campaigns
              </CardTitle>
              <CardDescription className="text-base">
                Check the performance of your previous campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-600 dark:text-gray-300 text-center py-4">
                  {session?.user ? 'View your campaign history, analytics, and results' : 'No campaigns yet. Create your first one!'}
                </p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline">
                  View History <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Text */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400">
            Need help getting started? <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">Check our guide</a> or <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">watch the tutorial</a>
          </p>
        </div>
      </div>
    </div>
  )
}
