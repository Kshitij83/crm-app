'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, Zap } from 'lucide-react'
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
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30">
            <Zap className="h-4 w-4" />
          </span>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Nex<span className="text-blue-600 dark:text-blue-400">Fluent</span>
          </h1>
        </Link>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-x-3">
        <ThemeToggle />

        {/* Profile dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-x-2 rounded-full p-1.5 transition-colors hover:bg-accent focus:outline-none"
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Account menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-medium text-white">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {session?.user?.name || 'User'}
              </p>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-white shadow-lg dark:bg-gray-900">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {session?.user?.name || 'User'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {session?.user?.email || 'user@example.com'}
                </p>
              </div>
              <button
                className="flex w-full items-center px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

