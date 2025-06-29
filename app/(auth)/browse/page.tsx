import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getSharedExams, getUserExams, getBulkExamStatsByMode } from '@/lib/supabase/db'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ExamInfoCard } from '@/components/features/exam/ExamInfoCard'

interface BrowsePageProps {
  searchParams: Promise<{
    search?: string
    sort?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  return (
    <AuthGuard>
      <div className="w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Share</h2>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <BrowseContent searchParams={searchParams} />
        </Suspense>
      </div>
    </AuthGuard>
  )
}

async function BrowseContent({ searchParams }: BrowsePageProps) {
  const { search, sort } = await searchParams
  const [sharedExams, userExams] = await Promise.all([
    getSharedExams({
      searchTerm: search,
      sortBy: sort as 'newest' | 'likes'
    }),
    getUserExams()
  ])

  const mySharedExams = userExams.filter(exam => exam.is_shared)
  
  // N+1問題を解決：全試験の統計を一括取得
  const allExamIds = [...mySharedExams.map(e => e.id), ...sharedExams.map(e => e.id)]
  const statsMap = await getBulkExamStatsByMode(allExamIds)

  return (
    <div className="space-y-6">
      {mySharedExams.length > 0 && (
        <div className="space-y-4">
          <h3 className="section-title">共有中の試験</h3>
          <div className="card-grid">
            {mySharedExams.map((exam) => {
              const modeStats = statsMap.get(exam.id) || {
                warmup: { count: 0, attempts: 0 },
                review: { count: 0, attempts: 0 },
                repetition: { count: 0, attempts: 0 },
                comprehensive: { count: 0, attempts: 0 }
              };
              
              return (
                <ExamInfoCard
                  key={exam.id}
                  exam={exam}
                  modeStats={modeStats}
                  isOwner={true}
                  showShareToggle={true}
                />
              );
            })}
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <h3 className="section-title">共有試験</h3>
        
        {sharedExams.length > 0 ? (
          <div className="card-grid">
            {sharedExams.map((exam) => {
              const modeStats = statsMap.get(exam.id) || {
                warmup: { count: 0, attempts: 0 },
                review: { count: 0, attempts: 0 },
                repetition: { count: 0, attempts: 0 },
                comprehensive: { count: 0, attempts: 0 }
              };
              
              return (
                <ExamInfoCard
                  key={exam.id}
                  exam={exam}
                  modeStats={modeStats}
                  isOwner={false}
                  showLikeButton={true}
                  showShareToggle={false}
                  showImportButton={true}
                />
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">共有試験なし</h3>
                <p className="text-sm text-muted-foreground">現在共有されている試験はありません</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}