'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { api, Customer } from '@/lib/api'
import { format } from 'date-fns'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<
    'name' | 'email' | 'totalSpend' | 'visits' | 'lastActiveDate' | 'createdAt'
  >('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { page, search, sortBy, sortOrder }],
    queryFn: () =>
      api.getCustomers({
        page,
        limit: 10,
        search: search || undefined,
        sortBy,
        sortOrder,
      }),
  })

  const customers = data?.customers || []
  const pagination = data?.pagination

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const getCustomerStatus = (customer: Customer) => {
    const daysSinceLastActive = customer.lastActiveDate
      ? Math.floor(
          (Date.now() - new Date(customer.lastActiveDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

    if (daysSinceLastActive === null)
      return { label: 'Never Active', variant: 'secondary' as const }
    if (daysSinceLastActive <= 7)
      return { label: 'Active', variant: 'success' as const }
    if (daysSinceLastActive <= 30)
      return { label: 'Recently Active', variant: 'warning' as const }
    return { label: 'Inactive', variant: 'destructive' as const }
  }

  const activeCount = customers.filter((c) => {
    const daysSinceLastActive = c.lastActiveDate
      ? Math.floor((Date.now() - new Date(c.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24))
      : null
    return daysSinceLastActive !== null && daysSinceLastActive <= 30
  }).length

  const highValueCount = customers.filter((c) => c.totalSpend > 2000).length

  const newThisMonth = customers.filter((c) => {
    const createdAt = new Date(c.createdAt)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return createdAt > monthAgo
  }).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={
          pagination?.total != null
            ? `${pagination.total.toLocaleString()} customers in your database`
            : 'Manage your customer database'
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={isLoading ? '…' : pagination?.total?.toLocaleString() ?? '—'}
          icon={<Users className="h-5 w-5" />}
          accent="blue"
        />
        <StatCard
          label="Active (30d)"
          value={isLoading ? '…' : activeCount}
          icon={<Activity className="h-5 w-5" />}
          accent="green"
          hint="Interacted in the last 30 days"
        />
        <StatCard
          label="High Value"
          value={isLoading ? '…' : highValueCount}
          icon={<DollarSign className="h-5 w-5" />}
          accent="amber"
          hint="Spent over $2,000"
        />
        <StatCard
          label="New This Month"
          value={isLoading ? '…' : newThisMonth}
          icon={<Calendar className="h-5 w-5" />}
          accent="purple"
        />
      </div>

      {/* Customer table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>Search, sort, and manage your customers</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 sm:w-72"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Sort options */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="createdAt">Date Added</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="totalSpend">Total Spend</option>
                <option value="visits">Visits</option>
                <option value="lastActiveDate">Last Active</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Order:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-destructive">
              Failed to load customers. Please try again.
            </div>
          ) : customers.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {search
                  ? 'No customers match your search.'
                  : 'No customers yet. Import data or add your first customer.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="text-right">Total Spend</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Visits</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const status = getCustomerStatus(customer)
                  return (
                    <TableRow key={customer.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-medium text-white">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{customer.name}</p>
                            <p className="truncate text-xs text-muted-foreground md:hidden">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-0.5 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {customer.email}
                          </p>
                          {customer.phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {customer.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-semibold">
                          ${customer.totalSpend.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer._count?.orders ?? 0} orders
                        </p>
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
                        {customer.visits.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={status.variant} className="capitalize">
                          {status.label}
                        </Badge>
                        {customer.lastActiveDate && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {format(new Date(customer.lastActiveDate), 'MMM d, yyyy')}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
