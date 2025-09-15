'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Use useEffect to handle client-side rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render a button to avoid layout shift
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (mounted) {
          setTheme(theme === 'dark' ? 'light' : 'dark')
        }
      }}
      className="rounded-full"
      aria-label="Toggle theme"
    >
      {mounted ? (
        <>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </>
      ) : (
        <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
      )}
    </Button>
  )
}