'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Target, 
  Search, 
  Plus, 
  Users,
  Calendar,
  Eye,
  Check,
  ChevronRight
} from 'lucide-react'
import { api, Segment } from '@/lib/api'
import { format } from 'date-fns'
import Link from 'next/link'

interface SegmentSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (segment: Segment) => void
}

export function SegmentSelectorDialog({
  open,
  onOpenChange,
  onSelect
}: SegmentSelectorDialogProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [previewSegment, setPreviewSegment] = useState<Segment | null>(null)
  const [previewData, setPreviewData] = useState<{
    totalCustomers: number;
    customers: any[];
  } | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedSegmentId(null)
      setPreviewSegment(null)
      setPreviewData(null)
    }
  }, [open])

  // Query to fetch segments
  const { data, isLoading, error } = useQuery({
    queryKey: ['segments', { page, search }],
    queryFn: () => api.getSegments({ 
      page, 
      limit: 10, 
      search: search || undefined
    }),
    enabled: open
  })

  const segments = data?.segments || []
  const pagination = data?.pagination

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handlePreview = async (segment: Segment) => {
    setPreviewSegment(segment)
    setIsPreviewLoading(true)
    
    try {
      const data = await api.getSegmentPreview(segment.id)
      setPreviewData(data)
    } catch (error) {
      console.error('Error loading preview:', error)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleSelect = () => {
    if (selectedSegmentId) {
      const segment = segments.find(s => s.id === selectedSegmentId)
      if (segment) {
        onSelect(segment)
        onOpenChange(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Select a Segment</DialogTitle>
          <DialogDescription>
            Choose from your existing segments or create a new one
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Left panel - Segment list */}
          <div className="border rounded-md p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search segments..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[400px]">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                </div>
              ) : segments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No segments found</p>
                  <Button asChild className="mt-4" variant="outline" size="sm">
                    <Link href="/dashboard/campaigns/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Campaign
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-gray-100 ${
                        selectedSegmentId === segment.id ? 'bg-blue-50 border border-blue-200' : 'border border-gray-200'
                      }`}
                      onClick={() => setSelectedSegmentId(segment.id)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {selectedSegmentId === segment.id ? (
                            <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{segment.name}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(segment.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePreview(segment)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
          
          {/* Right panel - Preview */}
          <div className="border rounded-md p-4">
            {previewSegment ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-lg">{previewSegment.name}</h3>
                </div>
                
                <div className="mb-4 border-b pb-2">
                  <div className="text-sm text-gray-500 mb-1">Segment Rules:</div>
                  <div className="text-xs bg-gray-50 p-2 rounded">
                    {previewSegment.rules && typeof previewSegment.rules === 'object' ? (
                      <div>
                        <div className="font-medium mb-1">
                          Match {previewSegment.rules.operator === 'AND' ? 'ALL' : 'ANY'} conditions:
                        </div>
                        <ul className="list-disc list-inside">
                          {previewSegment.rules.rules?.map((rule: any, index: number) => (
                            <li key={index} className="ml-2">
                              {rule.field} {rule.operator} {rule.value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div>No rules defined</div>
                    )}
                  </div>
                </div>
                
                {isPreviewLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="h-8 w-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                  </div>
                ) : previewData ? (
                  <div>
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-blue-600">{previewData.totalCustomers}</div>
                      <div className="text-sm text-gray-600">customers match this segment</div>
                    </div>
                    
                    {previewData.customers.length > 0 ? (
                      <div>
                        <div className="text-sm font-medium mb-2">Sample Customers:</div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {previewData.customers.slice(0, 5).map((customer, idx) => (
                            <div key={idx} className="text-xs p-2 border rounded">
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-gray-500">{customer.email}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No matching customers found
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <Target className="h-12 w-12 mb-2 text-gray-300" />
                    <p>Click the eye icon to preview segment</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Target className="h-16 w-16 mb-4 text-gray-300" />
                <p>Select a segment to preview</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/dashboard/campaigns/new">
                <Plus className="h-4 w-4 mr-2" />
                Create New Campaign
              </Link>
            </Button>
            <Button onClick={handleSelect} disabled={!selectedSegmentId}>
              <Check className="h-4 w-4 mr-2" />
              Select Segment
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}