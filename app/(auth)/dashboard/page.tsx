import { Suspense } from 'react'
import { getAnalyticsData } from '@/lib/supabase/db'
import { AuthGuard } from '@/components/shared/AuthGuard'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </AuthGuard>
  )
}

async function DashboardContent() {
  const analytics = await getAnalyticsData()
  return <DashboardClient analytics={analytics} />
}