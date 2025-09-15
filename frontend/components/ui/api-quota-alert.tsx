'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export function ApiQuotaAlert() {
  const [visible, setVisible] = useState(false)
  const [hasQuotaIssue, setHasQuotaIssue] = useState(false)
  
  // Check for quota issues on mount and when localStorage changes
  useEffect(() => {
    const checkQuotaStatus = () => {
      const quotaIssue = localStorage.getItem('ai_quota_issue')
      if (quotaIssue === 'true') {
        setHasQuotaIssue(true)
        setVisible(true)
      }
    }
    
    // Check initially
    checkQuotaStatus()
    
    // Listen for changes to localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ai_quota_issue') {
        checkQuotaStatus()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  // If no quota issue, don't render anything
  if (!hasQuotaIssue) return null
  
  // If alert is dismissed, don't show it
  if (!visible) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg shadow-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            AI API Quota Exceeded
          </h3>
          <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            <p>
              The application is currently experiencing issues with the AI API due to quota limitations. 
              AI-powered features will be unavailable until the quota is reset.
            </p>
            <p className="mt-1">
              See the <a href="/dashboard/settings" className="font-medium underline">settings page</a> for more information.
            </p>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setVisible(false)}
            className="inline-flex rounded-md bg-amber-50 dark:bg-amber-950 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}