import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Tag } from 'lucide-react'
import { LikeButton } from '@/components/features/exam-browser/LikeButton'
import { SessionStartButton } from '@/components/shared/SessionStartButton'
import { getSharedExams, getUserExams, getBulkExamStatsByMode } from '@/lib/supabase/db'
import { ExamSet, ExamModeStats } from '@/lib/types'
import { ImportSharedExamButton } from '@/components/features/exam-browser/ImportSharedExamButton'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface BrowsePageProps {
  searchParams: Promise<{
    search?: string
    sort?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  return (
    <AuthGuard>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Share</h2>
        </div>
        
        <Suspense fallback={
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
            ))}
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
    <div className="space-y-8">
      {mySharedExams.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">共有中の試験</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">共有試験</h3>
        
        {sharedExams.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <div className="text-center space-y-3">
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

function MySharedExamCard({ exam, modeStats }: { exam: ExamSet; modeStats: ExamModeStats }) {
  const questionCount = exam.data?.questions?.length || 0
  const tags = exam.data?.tags || []

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="space-y-3">
          <CardTitle className="text-lg font-semibold">
            {exam.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(exam.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        {/* タグ情報 */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span>タグ</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag.項目名}: {tag.値}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            {questionCount}設問
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{exam.likes_count}いいね</span>
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
  const tags = exam.data?.tags || []

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="space-y-3">
          <CardTitle className="text-lg font-semibold">
            {exam.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(exam.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        {/* タグ情報 */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span>タグ</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag.項目名}: {tag.値}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            {questionCount}設問
          </Badge>
          <LikeButton 
            examId={exam.id}
            initialLiked={exam.isLiked || false}
            initialCount={exam.likes_count}
          />
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex gap-3">
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