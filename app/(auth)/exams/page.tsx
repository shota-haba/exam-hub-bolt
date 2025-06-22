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
import { getUserExams, getExamStatsByMode } from '@/lib/supabase/db'
import { createClient } from '@/lib/supabase/server'
import { ExamSet } from '@/lib/types'
import { DeleteExamButton } from '@/components/features/exam-manager/DeleteExamButton'

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const exams = await getUserExams(user.id)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Session</h2>
      </div>

      <div className="space-y-4">
        <ExamImport />
        
        <div>
          <h3 className="text-lg font-medium mb-4">試験一覧</h3>
          
          <Suspense fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          }>
            {exams.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {exams.map((exam) => (
                  <ExamManagementCard key={exam.id} exam={exam} userId={user.id} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">試験データなし</h3>
                    <p className="text-sm text-muted-foreground">上記のフォームから試験データをインポートしてください</p>
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

async function ExamManagementCard({ exam, userId }: { exam: ExamSet; userId: string }) {
  const questionCount = exam.data?.questions?.length || 0
  const modeStats = await getExamStatsByMode(exam.id, userId)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {exam.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {new Date(exam.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/exams/${exam.id}/edit`}>編集</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <DeleteExamButton examId={exam.id} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {questionCount}設問
          </Badge>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-sm font-bold">{modeStats.warmup.count}</div>
            <div className="text-xs text-muted-foreground">予習</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-sm font-bold">{modeStats.review.count}</div>
            <div className="text-xs text-muted-foreground">復習</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-sm font-bold">{modeStats.repetition.count}</div>
            <div className="text-xs text-muted-foreground">反復</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="text-sm font-bold">{modeStats.comprehensive.count}</div>
            <div className="text-xs text-muted-foreground">総合</div>
          </div>
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