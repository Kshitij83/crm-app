'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CampaignList } from '@/components/ui/campaign-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Megaphone, 
  Plus,
  Send,
  TrendingUp,
  Users,
  Loader2
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export default function CampaignsPage() {
  // Fetch campaigns stats
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns-stats'],
    queryFn: () => api.getCampaigns({ limit: 100 }),
  })

  // Calculate stats
  const totalCampaigns = data?.campaigns?.length || 0
  const sentCampaigns = data?.campaigns?.filter(c => c.status === 'sent')?.length || 0
  
  // Calculate total recipients and success rate
  let totalRecipients = 0
  let successfulRecipients = 0
  
  if (data?.campaigns) {
    data.campaigns.forEach(campaign => {
      if (campaign.stats) {
        totalRecipients += campaign.stats.totalSent || 0
        successfulRecipients += campaign.stats.successCount || 0
      }
    })
  }
  
  const avgSuccessRate = totalRecipients > 0 
    ? ((successfulRecipients / totalRecipients) * 100).toFixed(1)
    : '0.0'
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your marketing campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Campaigns
            </CardTitle>
            <Megaphone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalCampaigns}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Sent Campaigns
            </CardTitle>
            <Send className="h-4 w-4 text-green-500 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {sentCampaigns}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Avg. Success Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgSuccessRate}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Recipients
            </CardTitle>
            <Users className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-gray-500">Loading...</span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRecipients.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      <CampaignList />
    </div>
  )
}

