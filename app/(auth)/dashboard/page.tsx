import { Suspense } from 'react'
import { getAnalyticsData } from '@/lib/supabase/db'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
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