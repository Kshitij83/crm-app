'use client'

import Link from 'next/link'
import { StarField } from '@/components/ui/star-field'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { FeatureCard } from '@/components/ui/feature-card'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Users,
  BarChart3,
  MessageSquare,
  Database,
  Zap,
  BrainCircuit,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const features = [
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Audience Segmentation',
    description:
      'Create dynamic customer segments with powerful AI-driven rule-based logic.',
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'AI Campaign Creation',
    description:
      'Design and track targeted campaigns with AI-generated content and message suggestions.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Campaign Analytics',
    description:
      'Get real-time insights and performance metrics to optimize every campaign you send.',
  },
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    title: 'Natural Language Rules',
    description:
      'Describe your audience in plain English and let AI build the segmentation rules for you.',
  },
  {
    icon: <Database className="h-6 w-6" />,
    title: 'Customer Data Platform',
    description:
      'Securely manage customers, orders, and communication history in one place.',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Real-time Processing',
    description:
      'Event-driven architecture with message queues for fast, scalable delivery.',
  },
]

const highlights = [
  'AI-powered audience building',
  'Campaign delivery simulation',
  'Real-time performance analytics',
]

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }

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
                behavior: 'smooth',
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-blue-50/50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <StarField />

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30">
              <Zap className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Nex<span className="text-blue-600 dark:text-blue-400">Fluent</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {status === 'loading' ? (
              <Button disabled variant="outline">
                <span className="animate-pulse">Loading...</span>
              </Button>
            ) : status === 'authenticated' ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            AI-Powered Mini CRM Platform
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-6xl">
            Grow relationships with an{' '}
            <span className="text-gradient">AI-powered CRM</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300 md:text-xl">
            Supercharge your customer relationships with intelligent audience
            segmentation, campaign automation, and real-time analytics.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/auth/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <a href="#features">Learn More</a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
            {highlights.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            Powerful features, beautifully simple
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Everything you need to understand your customers and run campaigns
            that convert — powered by AI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 py-8 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-6 text-center text-gray-600 dark:text-gray-400">
          <p>
            © {new Date().getFullYear()} NexFluent. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
