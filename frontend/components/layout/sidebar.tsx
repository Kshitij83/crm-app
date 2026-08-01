'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  LogOut,
  Zap,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-6 overflow-y-auto border-r border-border bg-white px-4 py-6 dark:bg-gray-950">
        <div className="flex h-12 shrink-0 items-center px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30">
              <Zap className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Nex<span className="text-blue-600 dark:text-blue-400">Fluent</span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-y-8">
          <div>
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </p>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-muted-foreground group-hover:text-foreground'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-auto">
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="group flex w-full items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
