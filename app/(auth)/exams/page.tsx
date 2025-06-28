import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Calendar, Tag, Plus } from 'lucide-react'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function ExamsPage() {
  return (
    <AuthGuard>
      <div className="w-full px-2 py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Session</h2>
        </div>

        <div className="space-y-6">
          <ExamImport />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">試験一覧</h3>
            </div>
            
            <Suspense fallback={
              <div className="h-64 bg-muted rounded-md animate-pulse" />
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
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">試験データなし</h3>
            <p className="text-sm text-muted-foreground">上記のフォームから試験データをインポートしてください</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">試験名</TableHead>
            <TableHead className="text-center">設問数</TableHead>
            <TableHead className="text-center">予習</TableHead>
            <TableHead className="text-center">復習</TableHead>
            <TableHead className="text-center">反復</TableHead>
            <TableHead className="text-center">総合</TableHead>
            <TableHead className="text-center">共有</TableHead>
            <TableHead className="w-[180px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {exams.map((exam) => {
            const questionCount = exam.data?.questions?.length || 0;
            const tags = exam.data?.tags || [];
            const modeStats = statsMap.get(exam.id) || {
              warmup: { count: 0, attempts: 0 },
              review: { count: 0, attempts: 0 },
              repetition: { count: 0, attempts: 0 },
              comprehensive: { count: 0, attempts: 0 }
            };
            
            return (
              <TableRow key={exam.id}>
                <TableCell>
                  <div className="font-medium">{exam.title}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(exam.created_at).toLocaleDateString()}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag.項目名}: {tag.値}
                        </Badge>
                      ))}
                      {tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">{questionCount}</TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">{modeStats.warmup.count}</div>
                  <div className="text-xs text-muted-foreground">{modeStats.warmup.attempts}回</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">{modeStats.review.count}</div>
                  <div className="text-xs text-muted-foreground">{modeStats.review.attempts}回</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">{modeStats.repetition.count}</div>
                  <div className="text-xs text-muted-foreground">{modeStats.repetition.attempts}回</div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-medium">{modeStats.comprehensive.count}</div>
                  <div className="text-xs text-muted-foreground">{modeStats.comprehensive.attempts}回</div>
                </TableCell>
                <TableCell className="text-center">
                  <ShareToggle examId={exam.id} initialShared={exam.is_shared} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <SessionStartButton 
                      examId={exam.id} 
                      modeStats={modeStats}
                      size="sm"
                      className="flex-1"
                    >
                      開始
                    </SessionStartButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  )
}