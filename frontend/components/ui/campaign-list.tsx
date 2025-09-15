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
import { Search, Eye, BarChart, ChevronLeft, ChevronRight } from 'lucide-react'

// Campaign status types and colors
const statusColors = {
  'scheduled': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'sending': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
} as const

type CampaignStatus = keyof typeof statusColors

interface Campaign {
  id: string
  name: string
  segment: string
  status: CampaignStatus
  recipients: number
  openRate: number
  clickRate: number
  sentDate: string
}

// Mock campaign data
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Sale Announcement',
    segment: 'Active Customers',
    status: 'completed',
    recipients: 1245,
    openRate: 68.4,
    clickRate: 24.2,
    sentDate: '2023-06-15'
  },
  {
    id: '2',
    name: 'New Product Launch',
    segment: 'Previous Buyers',
    status: 'scheduled',
    recipients: 876,
    openRate: 0,
    clickRate: 0,
    sentDate: '2023-07-10'
  },
  {
    id: '3',
    name: 'Customer Feedback Request',
    segment: 'All Customers',
    status: 'sending',
    recipients: 2150,
    openRate: 32.1,
    clickRate: 8.7,
    sentDate: '2023-07-05'
  },
  {
    id: '4',
    name: 'Loyalty Program Invitation',
    segment: 'High-Value Customers',
    status: 'draft',
    recipients: 432,
    openRate: 0,
    clickRate: 0,
    sentDate: '-'
  },
  {
    id: '5',
    name: 'Black Friday Preview',
    segment: 'All Subscribers',
    status: 'failed',
    recipients: 1876,
    openRate: 12.3,
    clickRate: 3.4,
    sentDate: '2023-06-29'
  }
]

export function CampaignList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Filter campaigns by search query
  const filteredCampaigns = mockCampaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.segment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.status.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Paginate campaigns
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentCampaigns = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage)
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
              <TableHead className="text-right">Open Rate</TableHead>
              <TableHead className="text-right">Click Rate</TableHead>
              <TableHead className="text-right">Sent Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCampaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>{campaign.segment}</TableCell>
                <TableCell>
                  <Badge className={statusColors[campaign.status]}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{campaign.recipients.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {campaign.openRate > 0 ? `${campaign.openRate}%` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {campaign.clickRate > 0 ? `${campaign.clickRate}%` : '-'}
                </TableCell>
                <TableCell className="text-right">{campaign.sentDate}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="View Campaign">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="View Analytics">
                      <BarChart className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {currentCampaigns.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No campaigns found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCampaigns.length)} of {filteredCampaigns.length}
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
                disabled={currentPage === totalPages}
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