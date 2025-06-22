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
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      }>
        <DashboardClient analytics={analytics} />
      </Suspense>
    </div>
  )
}