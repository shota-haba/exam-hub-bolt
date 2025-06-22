import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LikeButton } from '@/components/features/exam-browser/LikeButton'
import { SessionStartButton } from '@/components/shared/SessionStartButton'
import { getSharedExams, getUserExams, getBulkExamStatsByMode } from '@/lib/supabase/db'
import { createClient } from '@/lib/supabase/server'
import { ExamSet, ExamModeStats } from '@/lib/types'
import { ImportSharedExamButton } from '@/components/features/exam-browser/ImportSharedExamButton'

interface BrowsePageProps {
  searchParams: Promise<{
    search?: string
    sort?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const { search, sort } = await searchParams
  const [sharedExams, userExams] = await Promise.all([
    getSharedExams(user.id, {
      searchTerm: search,
      sortBy: sort as 'newest' | 'likes'
    }),
    getUserExams(user.id)
  ])

  const mySharedExams = userExams.filter(exam => exam.is_shared)
  
  // N+1問題を解決：全試験の統計を一括取得
  const allExamIds = [...mySharedExams.map(e => e.id), ...sharedExams.map(e => e.id)]
  const statsMap = await getBulkExamStatsByMode(allExamIds, user.id)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Share</h2>
      </div>
      
      <div className="space-y-4">
        {mySharedExams.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-4">共有中の試験</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mySharedExams.map((exam) => (
                <MySharedExamCard 
                  key={exam.id} 
                  exam={exam} 
                  modeStats={statsMap.get(exam.id) || {
                    warmup: { count: 0, attempts: 0 },
                    review: { count: 0, attempts: 0 },
                    repetition: { count: 0, attempts: 0 },
                    comprehensive: { count: 0, attempts: 0 }
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h3 className="text-lg font-medium mb-4">共有試験</h3>
          
          <Suspense fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          }>
            {sharedExams.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sharedExams.map((exam) => (
                  <SharedExamCard 
                    key={exam.id} 
                    exam={exam} 
                    modeStats={statsMap.get(exam.id) || {
                      warmup: { count: 0, attempts: 0 },
                      review: { count: 0, attempts: 0 },
                      repetition: { count: 0, attempts: 0 },
                      comprehensive: { count: 0, attempts: 0 }
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">共有試験なし</h3>
                    <p className="text-sm text-muted-foreground">現在共有されている試験はありません</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function MySharedExamCard({ exam, modeStats }: { exam: ExamSet; modeStats: ExamModeStats }) {
  const questionCount = exam.data?.questions?.length || 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            {exam.title}
          </CardTitle>
          <CardDescription className="text-xs">
            {new Date(exam.created_at).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {questionCount}設問
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{exam.likes_count}いいね</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <SessionStartButton 
          examId={exam.id} 
          modeStats={modeStats}
          className="w-full" 
          size="sm"
        >
          セッション開始
        </SessionStartButton>
      </CardFooter>
    </Card>
  )
}

function SharedExamCard({ exam, modeStats }: { exam: ExamSet; modeStats: ExamModeStats }) {
  const questionCount = exam.data?.questions?.length || 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            {exam.title}
          </CardTitle>
          <CardDescription className="text-xs">
            {new Date(exam.created_at).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 flex-1">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {questionCount}設問
          </Badge>
          <LikeButton 
            examId={exam.id}
            initialLiked={exam.isLiked || false}
            initialCount={exam.likes_count}
          />
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex gap-2">
        <ImportSharedExamButton examId={exam.id} />
        <SessionStartButton 
          examId={exam.id} 
          modeStats={modeStats}
          className="flex-1" 
          size="sm"
        >
          セッション開始
        </SessionStartButton>
      </CardFooter>
    </Card>
  )
}