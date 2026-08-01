import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  icon: ReactNode
  hint?: ReactNode
  accent?: 'blue' | 'green' | 'amber' | 'purple' | 'rose'
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, string> = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

export function StatCard({ label, value, icon, hint, accent = 'blue' }: StatCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="truncate text-3xl font-bold tracking-tight">{value}</p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={cn('rounded-xl p-2.5 shrink-0', accentStyles[accent])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
