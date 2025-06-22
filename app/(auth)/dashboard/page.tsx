import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getAnalyticsData } from '@/lib/supabase/db'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const analytics = await getAnalyticsData(user.id)

  return (
    <Suspense fallback={
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    }>
      <DashboardClient analytics={analytics} />
    </Suspense>
  )
}