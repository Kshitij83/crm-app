import axios from 'axios'
import { useSession } from 'next-auth/react'
import { API_URL } from './config'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  // Get token from localStorage (will be set during login)
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// API types
export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  totalSpend: number
  visits: number
  lastActiveDate?: string
  createdAt: string
  updatedAt: string
  orders?: Order[]
  _count?: {
    orders: number
    communicationLogs: number
  }
}

export interface Order {
  id: string
  customerId: string
  orderAmount: number
  orderDate: string
  createdAt: string
  updatedAt: string
  customer?: {
    id: string
    name: string
    email: string
  }
}

export interface Segment {
  id: string
  name: string
  rules: any
  createdBy: string
  createdAt: string
  updatedAt: string
  creator?: {
    id: string
    name: string
    email: string
  }
  _count?: {
    campaigns: number
  }
}

export interface Campaign {
  id: string
  segmentId: string
  messageText: string
  status: 'draft' | 'sent' | 'failed'
  createdBy: string
  createdAt: string
  updatedAt: string
  segment?: {
    id: string
    name: string
  }
  creator?: {
    id: string
    name: string
    email: string
  }
  stats?: {
    totalSent: number
    successCount: number
    failureCount: number
    successRate: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CustomersResponse {
  customers: Customer[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface OrdersResponse {
  orders: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SegmentsResponse {
  segments: Segment[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CampaignsResponse {
  campaigns: Campaign[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface OrderStats {
  period: string
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  topCustomers: Array<{
    customerId: string
    _sum: { orderAmount: number }
    _count: { id: number }
    customer?: {
      id: string
      name: string
      email: string
    }
  }>
}

// API functions
export const api = {
  // Customers
  getCustomers: async (params: PaginationParams & { 
    sortBy?: 'name' | 'email' | 'totalSpend' | 'visits' | 'lastActiveDate' | 'createdAt'
  } = {}): Promise<CustomersResponse> => {
    const response = await apiClient.get('/api/customers', { params })
    return response.data
  },

  getCustomer: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/api/customers/${id}`)
    return response.data
  },

  createCustomer: async (data: Partial<Customer>): Promise<{ customer: Customer }> => {
    const response = await apiClient.post('/api/customers', data)
    return response.data
  },

  updateCustomer: async (id: string, data: Partial<Customer>): Promise<{ customer: Customer }> => {
    const response = await apiClient.put(`/api/customers/${id}`, data)
    return response.data
  },

  // Orders
  getOrders: async (params: PaginationParams & {
    customerId?: string
    startDate?: string
    endDate?: string
    minAmount?: number
    maxAmount?: number
    sortBy?: 'orderDate' | 'orderAmount' | 'createdAt'
  } = {}): Promise<OrdersResponse> => {
    const response = await apiClient.get('/api/orders', { params })
    return response.data
  },

  getOrderStats: async (period: string = 'month'): Promise<OrderStats> => {
    const response = await apiClient.get('/api/orders/stats', { params: { period } })
    return response.data
  },

  createOrder: async (data: { customerId: string; orderAmount: number; orderDate?: string }): Promise<{ order: Order }> => {
    const response = await apiClient.post('/api/orders', data)
    return response.data
  },

  // Segments
  getSegments: async (params: PaginationParams = {}): Promise<SegmentsResponse> => {
    const response = await apiClient.get('/api/segments', { params })
    return response.data
  },

  getSegment: async (id: string): Promise<Segment> => {
    const response = await apiClient.get(`/api/segments/${id}`)
    return response.data
  },

  createSegment: async (data: { name: string; rules: any }): Promise<{ segment: Segment }> => {
    const response = await apiClient.post('/api/segments', data)
    return response.data
  },

  updateSegment: async (id: string, data: { name?: string; rules?: any }): Promise<{ segment: Segment }> => {
    const response = await apiClient.put(`/api/segments/${id}`, data)
    return response.data
  },

  getSegmentPreview: async (id: string): Promise<{
    segmentId: string
    segmentName: string
    totalCustomers: number
    customers: Customer[]
  }> => {
    const response = await apiClient.get(`/api/segments/${id}/preview`)
    return response.data
  },

  parseRules: async (description: string): Promise<{ rules: any }> => {
    const response = await apiClient.post('/api/segments/parse-rules', { description })
    return response.data
  },

  // Campaigns
  getCampaigns: async (params: PaginationParams = {}): Promise<CampaignsResponse> => {
    const response = await apiClient.get('/api/campaigns', { params })
    return response.data
  },

  getCampaign: async (id: string): Promise<Campaign> => {
    const response = await apiClient.get(`/api/campaigns/${id}`)
    return response.data
  },

  createCampaign: async (data: { segmentId: string; messageText: string }): Promise<{
    campaign: Campaign
    delivery: {
      totalCustomers: number
      successCount: number
      failureCount: number
      successRate: number
    }
  }> => {
    const response = await apiClient.post('/api/campaigns', data)
    return response.data
  },

  updateCampaignStatus: async (id: string, status: 'draft' | 'sent' | 'failed'): Promise<{ campaign: Campaign }> => {
    const response = await apiClient.post(`/api/campaigns/${id}/receipt`, { status })
    return response.data
  },

  getMessageSuggestions: async (data: {
    objective: string
    targetAudience: string
    tone?: 'professional' | 'casual' | 'friendly' | 'urgent'
    maxLength?: number
  }): Promise<{ suggestions: string[] }> => {
    const response = await apiClient.post('/api/campaigns/suggest-message', data)
    return response.data
  },

  getCampaignInsights: async (id: string): Promise<{ insights: string }> => {
    const response = await apiClient.get(`/api/campaigns/${id}/insights`)
    return response.data
  },
}

export default api

