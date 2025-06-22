import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LikeButton } from '@/components/features/exam-browser/LikeButton'
import { ExamImport } from '@/components/features/exam-manager/ExamImport'
import { getSharedExams, getUserExams } from '@/lib/supabase/db'
import { createClient } from '@/lib/supabase/server'
import { ExamSet } from '@/lib/types'
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

  // 自分が共有している試験を取得
  const mySharedExams = userExams.filter(exam => exam.is_shared)

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>共有</h1>
      </div>
      
      <div className="space-y-8">
        <ExamImport />
        
        {mySharedExams.length > 0 && (
          <div>
            <h2 className="mb-6">共有中の試験</h2>
            <div className="card-grid">
              {mySharedExams.map((exam) => (
                <MySharedExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h2 className="mb-6">共有試験</h2>
          
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

function MySharedExamCard({ exam }: { exam: ExamSet }) {
  const questionCount = exam.data?.questions?.length || 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <CardTitle className="text-base font-medium">
            {exam.title}
          </CardTitle>
          <CardDescription className="text-sm">
            {new Date(exam.created_at).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-sm">
            {questionCount}設問
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{exam.likes_count}いいね</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button asChild className="w-full">
          <Link href={`/exam/${exam.id}?mode=comprehensive&count=10&time=30`}>
            セッション
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function SharedExamCard({ exam, userId }: { exam: ExamSet; userId: string }) {
  const questionCount = exam.data?.questions?.length || 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <CardTitle className="text-base font-medium">
            {exam.title}
          </CardTitle>
          <CardDescription className="text-sm">
            {new Date(exam.created_at).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-sm">
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
        <Button asChild className="flex-1">
          <Link href={`/exam/${exam.id}?mode=comprehensive&count=10&time=30`}>
            セッション
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}