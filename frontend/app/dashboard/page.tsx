'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import {
  Users,
  Megaphone,
  DollarSign,
  Target,
  Plus,
  ArrowRight,
  Sparkles,
  Send,
  ArrowUpRight,
  TrendingUp,
  Layers,
  WifiOff,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { PageHeader } from '@/components/ui/page-header'
import { api } from '@/lib/api'
import { useState } from 'react'

const statusVariant: Record<string, 'success' | 'secondary' | 'destructive'> = {
  sent: 'success',
  draft: 'secondary',
  failed: 'destructive',
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isCreating, setIsCreating] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [customersRes, campaignsRes, segmentsRes, ordersRes] = await Promise.allSettled([
        api.getCustomers({ limit: 1 }),
        api.getCampaigns({ limit: 100 }),
        api.getSegments({ limit: 1 }),
        api.getOrderStats('month'),
      ])

      const customers = customersRes.status === 'fulfilled' ? customersRes.value : null
      const campaigns = campaignsRes.status === 'fulfilled' ? campaignsRes.value : null
      const segments = segmentsRes.status === 'fulfilled' ? segmentsRes.value : null
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value : null

      return {
        connected: customersRes.status === 'fulfilled',
        customers,
        campaigns,
        segments,
        orders,
      }
    },
    retry: 0,
    staleTime: 60 * 1000,
  })

  const handleCreateCampaign = () => {
    setIsCreating(true)
    router.push('/dashboard/campaigns/new')
  }

  const campaigns = data?.campaigns?.campaigns ?? []
  const segments = data?.segments?.segments ?? []
  const connected = data?.connected ?? false

  const totalCustomers = data?.customers?.pagination?.total
  const totalCampaigns = data?.campaigns?.pagination?.total
  const totalSegments = data?.segments?.pagination?.total
  const sentCampaigns = campaigns.filter((c) => c.status === 'sent').length
  const revenue = data?.orders?.totalRevenue
  const totalOrders = data?.orders?.totalOrders

  let totalRecipients = 0
  let successfulRecipients = 0
  campaigns.forEach((c) => {
    if (c.stats) {
      totalRecipients += c.stats.totalSent || 0
      successfulRecipients += c.stats.successCount || 0
    }
  })
  const avgSuccessRate =
    totalRecipients > 0 ? Math.round((successfulRecipients / totalRecipients) * 100) : null

  const recentCampaigns = campaigns.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shadow-lg shadow-blue-600/20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 right-32 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-100">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p className="max-w-xl text-blue-100">
              Build targeted audiences, craft AI-powered campaigns, and watch your engagement grow.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Button
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-blue-50"
              onClick={handleCreateCampaign}
              disabled={isCreating}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Backend status notice */}
      {!isLoading && !connected && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            The backend API isn&apos;t reachable right now, so live metrics can&apos;t be loaded.
            The app still works — data will appear once the API server is running and configured.
          </p>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={isLoading ? '…' : totalCustomers?.toLocaleString() ?? '—'}
          icon={<Users className="h-5 w-5" />}
          accent="blue"
          hint={totalOrders != null ? `${totalOrders.toLocaleString()} orders this month` : 'Customer base'}
        />
        <StatCard
          label="Revenue (30d)"
          value={
            isLoading ? '…' : revenue != null ? `$${Number(revenue).toLocaleString()}` : '—'
          }
          icon={<DollarSign className="h-5 w-5" />}
          accent="green"
          hint="Gross order value"
        />
        <StatCard
          label="Campaigns"
          value={isLoading ? '…' : totalCampaigns?.toLocaleString() ?? '—'}
          icon={<Megaphone className="h-5 w-5" />}
          accent="purple"
          hint={
            avgSuccessRate != null ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                {avgSuccessRate}% avg. delivery
              </span>
            ) : (
              'Delivery performance'
            )
          }
        />
        <StatCard
          label="Segments"
          value={isLoading ? '…' : totalSegments?.toLocaleString() ?? '—'}
          icon={<Target className="h-5 w-5" />}
          accent="amber"
          hint={`${sentCampaigns} sent campaigns`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent campaigns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your latest sends and their performance</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/campaigns">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : recentCampaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center">
                <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No campaigns yet.</p>
                <Button size="sm" className="mt-4" asChild>
                  <Link href="/dashboard/campaigns/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first campaign
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentCampaigns.map((campaign) => {
                  const subject = (campaign.messageText || '').match(
                    /Subject: (.*?)(\n|$)/
                  )?.[1]
                  return (
                    <li key={campaign.id} className="group flex items-center gap-4 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Send className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {subject || 'Untitled campaign'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {campaign.segment?.name || 'No segment'} ·{' '}
                          {campaign.createdAt
                            ? format(parseISO(campaign.createdAt), 'MMM d, yyyy')
                            : '—'}
                        </p>
                      </div>
                      <div className="hidden items-center gap-4 sm:flex">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {campaign.stats?.totalSent?.toLocaleString() ?? '0'}
                          </p>
                          <p className="text-xs text-muted-foreground">recipients</p>
                        </div>
                        <Badge
                          variant={statusVariant[campaign.status] || 'secondary'}
                          className="w-20 justify-center capitalize"
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <Link
                        href="/dashboard/campaigns"
                        className="text-muted-foreground transition-colors group-hover:text-foreground"
                        aria-label="Open campaign"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump straight into the workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" onClick={handleCreateCampaign} disabled={isCreating}>
                <Sparkles className="mr-2 h-4 w-4" />
                New AI Campaign
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/customers">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Customers
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/campaigns">
                  <Megaphone className="mr-2 h-4 w-4" />
                  View Campaigns
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Segments</CardTitle>
              <CardDescription>Recently created audiences</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              ) : segments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No segments yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {segments.slice(0, 4).map((segment) => (
                    <li
                      key={segment.id}
                      className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
                    >
                      <Target className="h-4 w-4 shrink-0 text-amber-500" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{segment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {segment._count?.campaigns ?? 0} campaigns
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
