import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { ExamImport } from '@/components/features/exam-manager/ExamImport'
import { ShareToggle } from '@/components/features/exam-manager/ShareToggle'
import { getUserExams, getDashboardStats, getExamProgress } from '@/lib/supabase/db'
import { createClient } from '@/lib/supabase/server'
import { ExamSet } from '@/lib/types'
import { deleteExamAction } from '@/actions/exam'

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const [exams, stats] = await Promise.all([
    getUserExams(user.id),
    getDashboardStats(user.id)
  ])

  return (
    <main className="container py-8 px-4 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">試験管理</h1>
          <p className="text-sm text-muted-foreground">問題セットのインポートと管理</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">ダッシュボード</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">試験数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">問題数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">平均進捗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">平均時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAnswerTime}秒</div>
          </CardContent>
        </Card>
      </div>

      <ExamImport />
      
      <div>
        <h2 className="text-lg font-semibold mb-4">試験コレクション</h2>
        
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        }>
          {exams.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <ExamManagementCard key={exam.id} exam={exam} userId={user.id} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center space-y-2">
                  <h3 className="font-medium">試験データなし</h3>
                  <p className="text-sm text-muted-foreground">
                    上記のインポートフォームを使用して問題セットを追加
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </Suspense>
      </div>
    </main>
  )
}

async function ExamManagementCard({ exam, userId }: { exam: ExamSet; userId: string }) {
  const questionCount = exam.data?.questions?.length || 0
  const progress = await getExamProgress(exam.id, userId)

  return (
    <Card className="group hover:bg-accent/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate group-hover:text-primary transition-colors">
              {exam.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {new Date(exam.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <form action={async () => {
                'use server'
                await deleteExamAction(exam.id)
              }}>
                <DropdownMenuItem asChild>
                  <button 
                    type="submit"
                    className="w-full text-left text-destructive hover:text-destructive"
                    onClick={(e) => {
                      if (!confirm('この試験を削除しますか？')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    削除
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {questionCount}問
          </Badge>
          <div className="text-right">
            <div className="text-lg font-bold">{progress}%</div>
            <div className="text-xs text-muted-foreground">完了</div>
          </div>
        </div>
        
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="h-1.5 rounded-full bg-foreground transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ShareToggle examId={exam.id} initialShared={exam.is_shared} />
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button asChild className="w-full" size="sm">
          <Link href={`/exam/${exam.id}?mode=comprehensive&count=10&time=30`}>
            セッション開始
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}