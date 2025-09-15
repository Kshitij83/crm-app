'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Eye, BarChart, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api, { Campaign } from '@/lib/api'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'

// Campaign status types and colors
const statusColors = {
  'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'sent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
} as const

export function CampaignList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Fetch campaigns from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['campaigns', { page: currentPage, search: searchQuery }],
    queryFn: () => api.getCampaigns({ 
      page: currentPage,
      limit: itemsPerPage,
      search: searchQuery || undefined
    }),
  })
  
  const campaigns = data?.campaigns || []
  const pagination = data?.pagination
  
  const nextPage = () => {
    if (pagination && currentPage < pagination.pages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }
  
  // Get campaign subject from message text
  const getCampaignSubject = (messageText: string): string => {
    if (!messageText) return 'Untitled Campaign'
    
    const subjectMatch = messageText.match(/Subject: (.*?)(\n|$)/)
    if (subjectMatch && subjectMatch[1]) {
      return subjectMatch[1].trim()
    }
    
    // If no subject found, return first line or truncated message
    const firstLine = messageText.split('\n')[0]
    return firstLine || messageText.substring(0, 30) + '...'
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Past Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Loading campaigns...</p>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Past Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-red-500">Failed to load campaigns. Please try again.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Past Campaigns</CardTitle>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search campaigns..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1) // Reset to first page on search
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Name</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Recipients</TableHead>
              <TableHead className="text-right">Success Rate</TableHead>
              <TableHead className="text-right">Created Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length > 0 ? (
              campaigns.map((campaign: Campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{getCampaignSubject(campaign.messageText)}</TableCell>
                  <TableCell>{campaign.segment?.name || 'Unknown Segment'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[campaign.status as keyof typeof statusColors] || statusColors.draft}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.stats?.totalSent || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.stats?.successRate ? `${campaign.stats.successRate.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.createdAt 
                      ? format(parseISO(campaign.createdAt), 'MMM d, yyyy')
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="View Campaign"
                        asChild
                      >
                        <Link href={`/dashboard/campaigns/${campaign.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="View Analytics"
                        onClick={() => {
                          toast.promise(
                            api.getCampaignInsights(campaign.id)
                              .then(({ insights }) => {
                                alert(insights)
                                return insights
                              }),
                            {
                              loading: 'Generating insights...',
                              success: 'Campaign insights generated!',
                              error: 'Failed to generate insights'
                            }
                          )
                        }}
                      >
                        <BarChart className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                  No campaigns found. 
                  {searchQuery ? 'Try a different search term.' : 'Create your first campaign!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={prevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextPage}
                disabled={currentPage === pagination.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}