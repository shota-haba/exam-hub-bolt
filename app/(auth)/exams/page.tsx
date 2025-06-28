import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Calendar, Tag } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { ExamImport } from '@/components/features/exam-manager/ExamImport'
import { ShareToggle } from '@/components/features/exam-manager/ShareToggle'
import { SessionStartButton } from '@/components/shared/SessionStartButton'
import { getUserExams, getBulkExamStatsByMode } from '@/lib/supabase/db'
import { ExamSet, ExamModeStats } from '@/lib/types'
import { DeleteExamButton } from '@/components/features/exam-manager/DeleteExamButton'
import { ExportExamButton } from '@/components/features/exam-manager/ExportExamButton'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default async function ExamsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Session</h2>
        </div>

        <div className="space-y-8">
          <ExamImport />
          
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">試験一覧</h3>
            
            <Suspense fallback={
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-80 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            }>
              <ExamsList />
            </Suspense>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

async function ExamsList() {
  const exams = await getUserExams()
  
  // N+1問題を解決：全試験の統計を一括取得
  const examIds = exams.map(exam => exam.id)
  const statsMap = await getBulkExamStatsByMode(examIds)

  if (exams.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold">試験データなし</h3>
            <p className="text-sm text-muted-foreground">上記のフォームから試験データをインポートしてください</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {exams.map((exam) => (
        <ExamManagementCard 
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
  )
}

function ExamManagementCard({ exam, modeStats }: { exam: ExamSet; modeStats: ExamModeStats }) {
  const questionCount = exam.data?.questions?.length || 0
  const tags = exam.data?.tags || []

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {exam.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(exam.created_at).toLocaleDateString()}
            </div>
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
                <ExportExamButton exam={exam} />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <DeleteExamButton examId={exam.id} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 flex-1">
        {/* タグ情報 */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span>タグ</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag.項目名}: {tag.値}
                </Badge>
              ))}
              {tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 設問数 */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            {questionCount}設問
          </Badge>
        </div>
        
        {/* モード別統計 */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-bold">{modeStats.warmup.count}</div>
            <div className="text-xs text-muted-foreground">予習</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-bold">{modeStats.review.count}</div>
            <div className="text-xs text-muted-foreground">復習</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-bold">{modeStats.repetition.count}</div>
            <div className="text-xs text-muted-foreground">反復</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-bold">{modeStats.comprehensive.count}</div>
            <div className="text-xs text-muted-foreground">総合</div>
          </div>
        </div>

        <ShareToggle examId={exam.id} initialShared={exam.is_shared} />
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