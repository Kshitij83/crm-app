'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CampaignList } from '@/components/ui/campaign-list'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import {
  Megaphone,
  Plus,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export default function CampaignsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns-stats'],
    queryFn: () => api.getCampaigns({ limit: 100 }),
  })

  const campaigns = data?.campaigns ?? []
  const totalCampaigns = data?.pagination?.total ?? campaigns.length
  const sentCampaigns = campaigns.filter((c) => c.status === 'sent').length

  let totalRecipients = 0
  let successfulRecipients = 0
  campaigns.forEach((campaign) => {
    if (campaign.stats) {
      totalRecipients += campaign.stats.totalSent || 0
      successfulRecipients += campaign.stats.successCount || 0
    }
  })

  const avgSuccessRate =
    totalRecipients > 0
      ? ((successfulRecipients / totalRecipients) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Manage your marketing campaigns"
      >
        <Button asChild>
          <Link href="/dashboard/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Campaigns"
          value={isLoading ? '…' : totalCampaigns.toLocaleString()}
          icon={<Megaphone className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Sent Campaigns"
          value={isLoading ? '…' : sentCampaigns}
          icon={<Send className="h-5 w-5" />}
          accent="green"
        />
        <StatCard
          label="Avg. Success Rate"
          value={isLoading ? '…' : `${avgSuccessRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          accent="purple"
        />
        <StatCard
          label="Total Recipients"
          value={isLoading ? '…' : totalRecipients.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* Campaign List */}
      <CampaignList />
    </div>
  )
}
