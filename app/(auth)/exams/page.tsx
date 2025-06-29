import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ExamImport } from '@/components/features/exam-manager/ExamImport'
import { getUserExams, getBulkExamStatsByMode } from '@/lib/supabase/db'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ExamInfoCard } from '@/components/features/exam/ExamInfoCard'

export default async function ExamsPage() {
  return (
    <AuthGuard>
      <div className="w-full px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Session</h2>
        </div>

        <div className="space-y-6">
          <ExamImport />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">試験一覧</h3>
            </div>
            
            <Suspense fallback={
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner size="lg" />
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
      <Card className="border-dashed bg-card/50">
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
    <div className="card-grid">
      {exams.map((exam) => {
        const modeStats = statsMap.get(exam.id) || {
          warmup: { count: 0, attempts: 0 },
          review: { count: 0, attempts: 0 },
          repetition: { count: 0, attempts: 0 },
          comprehensive: { count: 0, attempts: 0 }
        };
        
        return (
          <ExamInfoCard
            key={exam.id}
            exam={exam}
            modeStats={modeStats}
            isOwner={true}
            showShareToggle={true}
          />
        );
      })}
    </div>
  )
}