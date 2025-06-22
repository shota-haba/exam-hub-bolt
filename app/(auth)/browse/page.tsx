import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LikeButton } from '@/components/features/exam-browser/LikeButton'
import { getSharedExams } from '@/lib/supabase/db'
import { createClient } from '@/lib/supabase/server'
import { ExamSet } from '@/lib/types'
import { importSharedExamAction } from '@/actions/exam'

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
    <main className="container py-8 px-4 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">共有</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">ダッシュボード</Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <Input 
          placeholder="試験を検索..." 
          defaultValue={search}
          className="max-w-sm"
        />
        <select 
          defaultValue={sort || 'newest'}
          className="px-3 py-2 border rounded-md"
        >
          <option value="newest">新着順</option>
          <option value="likes">人気順</option>
        </select>
      </div>
      
      <div>
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        }>
          {sharedExams.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sharedExams.map((exam) => (
                <SharedExamCard key={exam.id} exam={exam} userId={user.id} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-2">
                  <h3 className="font-medium">共有試験なし</h3>
                </div>
              </CardContent>
            </Card>
          )}
        </Suspense>
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