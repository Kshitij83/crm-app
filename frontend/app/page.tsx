'use client'

import Link from 'next/link'
import { StarField } from '@/components/ui/star-field'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { FeatureCard } from '@/components/ui/feature-card'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Users, BarChart3, MessageSquare, Database, Zap, BrainCircuit } from 'lucide-react'

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  // Remove the mounted state as it's causing issues with double-loading
  
  useEffect(() => {
    // Only redirect if authenticated
    if (status === 'authenticated') {
      router.push('/dashboard')
    }

    // Add smooth scrolling for anchor links
    const handleAnchorClick = (e: Event) => {
      if (e.target instanceof HTMLElement) {
        const anchor = e.target.closest('a')
        if (anchor) {
          const href = anchor.getAttribute('href')
          if (href?.startsWith('#')) {
            e.preventDefault()
            const targetId = href.substring(1)
            const targetElement = document.getElementById(targetId)
            
            if (targetElement) {
              window.scrollTo({
                top: targetElement.offsetTop,
                behavior: 'smooth'
              })
            }
          }
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [status, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden relative">
      <StarField />
      
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nex<span className="text-blue-600 dark:text-blue-400">Fluent</span></h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {status === 'loading' ? (
            <Button disabled variant="outline">
              <span className="animate-pulse">Loading...</span>
            </Button>
          ) : status === 'authenticated' ? (
            <Button asChild>
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          ) : null}
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="relative z-10 px-6 py-12 md:py-16 max-w-7xl mx-auto mt-24 mb-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            AI-Powered <span className="text-blue-600 dark:text-blue-400">Nextgen CRM</span> for Effortless Business Growth
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Supercharge your customer relationships with AI-powered insights and automation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">
                <span className="dark:text-white">Get Started</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">
                <span className="dark:text-white">Learn More</span>
              </a>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-16 max-w-7xl mx-auto mt-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Powerful Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <FeatureCard
            icon={<Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            title="Audience Segmentation"
            description="Create dynamic customer segments with powerful AI-driven rule-based logic"
          />
          <FeatureCard
            icon={<MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            title="Campaign Creation"
            description="Design, schedule, and track targeted campaigns with AI-generated content"
          />
          <FeatureCard
            icon={<BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
            title="Campaign Analytics"
            description="Get real-time insights and performance metrics to optimize your campaigns"
          />
        </div>
      </section>

      
      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} NexFluent. All rights reserved.</p>
      </footer>
    </div>
  )
}

