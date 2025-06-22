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
import { deleteExamAction } from '@/lib/actions/exam'

export default async function ExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const exams = await getUserExams(user.id)

  return (
    <main className="page-container">
      <div className="page-header">
        <h1>セッション</h1>
      </div>

      <div className="space-y-8">
        <ExamImport />
        
        <div>
          <h2 className="mb-4">試験一覧</h2>
          
          <Suspense fallback={
            <div className="card-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded animate-pulse" />
              ))}
            </div>
          }>
            {exams.length > 0 ? (
              <div className="card-grid">
                {exams.map((exam) => (
                  <ExamManagementCard key={exam.id} exam={exam} userId={user.id} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <h3>試験データなし</h3>
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

async function ExamManagementCard({ exam, userId }: { exam: ExamSet; userId: string }) {
  const questionCount = exam.data?.questions?.length || 0
  const modeStats = await getExamStatsByMode(exam.id, userId)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {exam.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {new Date(exam.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <form action={async () => {
                  'use server'
                  await deleteExamAction(exam.id)
                }}>
                  <button 
                    type="submit"
                    className="w-full text-left text-destructive"
                    onClick={(e) => {
                      if (!confirm('この試験を削除しますか？')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    削除
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {questionCount}設問
          </Badge>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">{modeStats.warmup.count}</div>
            <div className="text-muted-foreground">予習</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">{modeStats.review.count}</div>
            <div className="text-muted-foreground">復習</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">{modeStats.repetition.count}</div>
            <div className="text-muted-foreground">反復</div>
          </div>
          <div className="text-center p-2 bg-muted rounded">
            <div className="font-medium">{modeStats.comprehensive.count}</div>
            <div className="text-muted-foreground">総合</div>
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