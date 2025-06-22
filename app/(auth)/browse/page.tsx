import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LikeButton } from '@/components/features/exam-browser/LikeButton'
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

  const mySharedExams = userExams.filter(exam => exam.is_shared)

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">共有</h1>
          <p className="page-description">試験データの共有とインポート</p>
        </div>
      </div>
      
      <div className="space-y-8">
        {mySharedExams.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-6">共有中の試験</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mySharedExams.map((exam) => (
                <MySharedExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">共有試験</h2>
          
          <Suspense fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          }>
            {sharedExams.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sharedExams.map((exam) => (
                  <SharedExamCard key={exam.id} exam={exam} userId={user.id} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold">共有試験なし</h3>
                    <p className="text-muted-foreground">現在共有されている試験はありません</p>
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

function MySharedExamCard({ exam }: { exam: ExamSet }) {
  const questionCount = exam.data?.questions?.length || 0

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <CardTitle className="text-lg font-semibold">
            {exam.title}
          </CardTitle>
          <CardDescription>
            {new Date(exam.created_at).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
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
            セッション開始
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
          <CardTitle className="text-lg font-semibold">
            {exam.title}
          </CardTitle>
          <CardDescription>
            {new Date(exam.created_at).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
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
            セッション開始
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}