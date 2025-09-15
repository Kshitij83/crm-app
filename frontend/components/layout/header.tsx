'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, User, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export function Header() {
  const { data: session } = useSession()
  const [showMenu, setShowMenu] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // (Removed unreachable return block)

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Logo and Brand */}
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Zap className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nex<span className="text-blue-600 dark:text-blue-400">Fluent</span></h1>
        </Link>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-x-4">
        <ThemeToggle />
        
        {/* Profile dropdown */}
        <div className="relative">
          <button 
            className="flex items-center gap-x-2 focus:outline-none"
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {session?.user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {session?.user?.name || 'User'}
              </p>
            </div>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {session?.user?.email || 'user@example.com'}
                  </p>
                </div>
                <Link 
                  href="/dashboard/profile" 
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowMenu(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
                <button
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

