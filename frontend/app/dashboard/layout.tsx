import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ApiQuotaAlert } from '@/components/ui/api-quota-alert'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="py-6 lg:py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      <ApiQuotaAlert />
    </div>
  )
}
