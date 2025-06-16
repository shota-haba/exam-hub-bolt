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
          <h1 className="text-3xl font-bold text-gray-900">試験管理</h1>
          <p className="text-gray-600 mt-1">問題集のインポート・管理</p>
        </div>
        <Button asChild>
          <Link href="/dashboard">ダッシュボード</Link>
        </Button>
      </div>

      <div className="dashboard-grid">
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">試験数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalExams}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">問題数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalQuestions}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均進捗</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.averageProgress}%</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均解答時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.averageAnswerTime}秒</div>
          </CardContent>
        </Card>
      </div>

      <ExamImport />
      
      <div>
        <h2 className="text-2xl font-semibold mb-6 text-gray-900">試験一覧</h2>
        
        <Suspense fallback={
          <div className="exam-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        }>
          {exams.length > 0 ? (
            <div className="exam-grid">
              {exams.map((exam) => (
                <ExamManagementCard key={exam.id} exam={exam} userId={user.id} />
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-gray-300 rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-16 w-16 bg-gray-100 rounded-xl mb-6 flex items-center justify-center">
                  <div className="h-8 w-8 bg-gray-300 rounded"></div>
                </div>
                <h3 className="text-xl font-medium mb-3 text-gray-900">試験がありません</h3>
                <p className="text-gray-600 text-center mb-8 max-w-md">
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

  const progressColor = progress >= 80 ? 'bg-green-500' : 
                       progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <Card className="exam-card group">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              {exam.title}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {new Date(exam.created_at).toLocaleDateString('ja-JP')}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    className="w-full text-left text-red-600 hover:text-red-700"
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
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            {questionCount}問
          </Badge>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{progress}%</div>
            <div className="text-xs text-gray-500">進捗</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
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