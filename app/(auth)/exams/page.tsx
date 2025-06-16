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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">試験管理</h1>
          <p className="text-muted-foreground mt-1">問題集のインポート・管理</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">試験数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <p className="text-xs text-muted-foreground">インポート済み</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">問題数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">全試験合計</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均進捗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
            <p className="text-xs text-muted-foreground">全試験平均</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均解答時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAnswerTime}秒</div>
            <p className="text-xs text-muted-foreground">1問あたり</p>
          </CardContent>
        </Card>
      </div>

      <ExamImport />
      
      <div>
        <h2 className="text-2xl font-semibold mb-6">試験一覧</h2>
        
        <Suspense fallback={<div>読み込み中...</div>}>
          {exams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <ExamManagementCard key={exam.id} exam={exam} userId={user.id} />
              ))}
            </div>
          ) : (
            <Card className="exam-card border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 bg-muted rounded-lg mb-6 flex items-center justify-center">
                  <div className="h-8 w-8 bg-muted-foreground/20 rounded"></div>
                </div>
                <h3 className="text-xl font-medium mb-3">試験がありません</h3>
                <p className="text-muted-foreground text-center mb-8 max-w-md">
                  上記のフォームから試験問題集をインポートしてください
                </p>
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
    <Card className="exam-card">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg">{exam.title}</CardTitle>
            <CardDescription>
              {new Date(exam.created_at).toLocaleDateString('ja-JP')}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
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
                    className="w-full text-left text-destructive focus:text-destructive"
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
      
      <CardContent className="pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            {questionCount}問
          </Badge>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">進捗</div>
            <div className="text-sm font-semibold">{progress}%</div>
          </div>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <ShareToggle examId={exam.id} initialShared={exam.is_shared} />
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button asChild className="w-full">
          <Link href={`/exam/${exam.id}?mode=comprehensive&count=10&time=30`}>
            学習開始
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}