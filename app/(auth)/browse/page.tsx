import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LikeButton } from '@/components/features/exam-browser/LikeButton'
import { ExamImport } from '@/components/features/exam-manager/ExamImport'
import { getSharedExams } from '@/lib/supabase/db'
import { createClient } from '@/lib/supabase/server'
import { ExamSet } from '@/lib/types'
import { importSharedExamAction } from '@/lib/actions/exam'

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
  const sharedExams = await getSharedExams(user.id, {
    searchTerm: search,
    sortBy: sort as 'newest' | 'likes'
  })

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>共有</h1>
      </div>
      
      <div className="space-y-8">
        <ExamImport />
        
        <div>
          <h2 className="mb-4">共有試験</h2>
          
          <Suspense fallback={
            <div className="card-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded animate-pulse" />
              ))}
            </div>
          }>
            {sharedExams.length > 0 ? (
              <div className="card-grid">
                {sharedExams.map((exam) => (
                  <SharedExamCard key={exam.id} exam={exam} userId={user.id} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <h3>共有試験なし</h3>
                  </div>
                </CardContent>
              </Card>
            )}
          </Suspense>
        </div>
      </div>
    </main>
  )
}

function SharedExamCard({ exam, userId }: { exam: ExamSet; userId: string }) {
  const questionCount = exam.data?.questions?.length || 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">
            {exam.title}
          </CardTitle>
          <CardDescription className="text-xs">
            {new Date(exam.created_at).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
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
        <form action={async () => {
          'use server'
          await importSharedExamAction(exam.id)
        }} className="flex-1">
          <Button type="submit" variant="outline" className="w-full" size="sm">
            インポート
          </Button>
        </form>
        <Button asChild className="flex-1" size="sm">
          <Link href={`/exam/${exam.id}?mode=comprehensive&count=10&time=30`}>
            セッション
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}