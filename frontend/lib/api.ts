import axios from 'axios'
import { getSession } from 'next-auth/react'
import { API_URL } from './config'

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    // First, try to get token from NextAuth session
    const session = await getSession()
    
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`
      return config
    }
    
    // Only as a fallback for backward compatibility, check localStorage
    // This helps with transition from old auth system to NextAuth
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        
        // Optional: If we want to clean up old tokens after using them once
        // localStorage.removeItem('auth_token')
      }
    }
  } catch (error) {
    console.error('Error setting authorization header:', error)
  }
  return config
})

// Handle API responses for quota tracking
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check for AI service quota errors from our API
    if (error.response?.status === 429 && 
        error.response?.data?.error === 'AI service quota exceeded') {
      // Set flag in localStorage that we're having quota issues
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai_quota_issue', 'true');
        // Trigger a storage event so other components can react
        window.dispatchEvent(new Event('storage'));
      }
    }
    
    return Promise.reject(error);
  }
);

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

  getSegmentPreview: async (id: string | any): Promise<any> => {
    // If id is a string, we're fetching an existing segment
    if (typeof id === 'string') {
      const response = await apiClient.get(`/api/segments/${id}/preview`)
      return response.data
    } 
    // Otherwise, id contains rules for preview
    else {
      const rules = id;
      const response = await apiClient.post('/api/segments/preview-rules', { rules })
      const totalCustomers = await api.getCustomers({ limit: 1 })
        .then(data => data.pagination.total || 0)
        .catch(() => 200); // Fallback default
      
      return {
        count: response.data.totalCustomers,
        percentage: response.data.totalCustomers > 0 ? 
          Math.round((response.data.totalCustomers / totalCustomers) * 100) : 0
      }
    }
  },

  parseRules: async (description: string): Promise<{ rules: any }> => {
    const response = await apiClient.post('/api/segments/parse-rules', { description });
    return response.data;
  },

  previewRules: async (rules: any): Promise<{
    totalCustomers: number;
    customers: Customer[];
  }> => {
    const response = await apiClient.post('/api/segments/preview-rules', { rules })
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

  createCampaign: async (data: { 
    segmentId?: string; // Optional for backward compatibility
    segmentName?: string; // New field for direct segment creation
    segmentRules?: any; // New field for direct segment creation
    messageText: string 
  }): Promise<{
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

  getCampaignInsights: async (id: string): Promise<{ insights: string }> => {
    const response = await apiClient.get(`/api/campaigns/${id}/insights`)
    return response.data
  },

  getMessageSuggestions: async (data: {
    objective: string
    targetAudience: string
    tone?: 'professional' | 'casual' | 'friendly' | 'urgent'
    maxLength?: number
  }): Promise<{ suggestions: string[] }> => {
    const response = await apiClient.post('/api/campaigns/suggest-message', data);
    return response.data;
  },

  // AI API status
  checkAIStatus: async (): Promise<{
    status: 'available' | 'unavailable',
    features: { [key: string]: boolean },
    quotaReset?: string
  }> => {
    try {
      const response = await apiClient.get('/api/campaigns/test-ai-features');
      
      if (response.data.quotaStatus === 'available') {
        // If the test was successful, clear any stored quota issues
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ai_quota_issue');
          // Trigger a storage event so other components can react
          window.dispatchEvent(new Event('storage'));
        }
      } else {
        // Update the quota issue flag
        if (typeof window !== 'undefined') {
          localStorage.setItem('ai_quota_issue', 'true');
          // Trigger a storage event so other components can react
          window.dispatchEvent(new Event('storage'));
        }
      }
      
      return {
        status: response.data.quotaStatus || 'unavailable',
        features: {
          messageSuggestions: response.data.testResults?.messageSuggestions?.status === 'success',
          ruleGeneration: response.data.testResults?.naturalLanguageRules?.status === 'success',
          campaignInsights: response.data.testResults?.campaignInsights?.status === 'success'
        },
        quotaReset: 'Typically reset monthly based on your Google AI plan'
      };
    } catch (error) {
      // Assume unavailable if test fails
      return {
        status: 'unavailable',
        features: {
          messageSuggestions: false,
          ruleGeneration: false,
          campaignInsights: false
        }
      };
    }
  },
}

export default api

