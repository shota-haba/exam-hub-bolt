'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useState } from 'react'
import { SessionSetupModal } from '@/components/features/exam-session/SessionSetupModal'
import { ExamModeStats } from '@/lib/types'

interface AnalyticsRow {
  examId: string
  examTitle: string
  warmupCount: number
  reviewCount: number
  repetitionCount: number
  dailySessions: number
  totalSessions: number
  modeStats: ExamModeStats & {
    warmup: { count: number; attempts: number }
    review: { count: number; attempts: number }
    repetition: { count: number; attempts: number }
    comprehensive: { count: number; attempts: number }
  }
}

interface DashboardClientProps {
  analytics: AnalyticsRow[]
}

export default function DashboardClient({ analytics }: DashboardClientProps) {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [selectedExamModeStats, setSelectedExamModeStats] = useState<ExamModeStats>({
    warmup: { count: 0, attempts: 0 },
    review: { count: 0, attempts: 0 },
    repetition: { count: 0, attempts: 0 },
    comprehensive: { count: 0, attempts: 0 }
  })

  const handleStartSession = (examId: string) => {
    const exam = analytics.find(e => e.examId === examId)
    if (exam) {
      setSelectedExamId(examId)
      setSelectedExamModeStats({
        warmup: { count: exam.modeStats.warmup.count, attempts: exam.modeStats.warmup.attempts },
        review: { count: exam.modeStats.review.count, attempts: exam.modeStats.review.attempts },
        repetition: { count: exam.modeStats.repetition.count, attempts: exam.modeStats.repetition.attempts },
        comprehensive: { count: exam.modeStats.comprehensive.count, attempts: exam.modeStats.comprehensive.attempts }
      })
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ダッシュボード</h1>
      </div>

      {analytics.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>アナリティクス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">試験タイトル</TableHead>
                    <TableHead className="text-center w-16">予習</TableHead>
                    <TableHead className="text-center w-16">復習</TableHead>
                    <TableHead className="text-center w-16">反復</TableHead>
                    <TableHead className="text-center w-16">日計</TableHead>
                    <TableHead className="text-center w-16">累計</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map((row) => (
                    <TableRow key={row.examId}>
                      <TableCell className="font-medium">{row.examTitle}</TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div>{row.warmupCount}</div>
                          <div className="text-xs text-muted-foreground">({row.modeStats.warmup.attempts}回)</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div>{row.reviewCount}</div>
                          <div className="text-xs text-muted-foreground">({row.modeStats.review.attempts}回)</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div>{row.repetitionCount}</div>
                          <div className="text-xs text-muted-foreground">({row.modeStats.repetition.attempts}回)</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{row.dailySessions}</TableCell>
                      <TableCell className="text-center">{row.totalSessions}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          onClick={() => handleStartSession(row.examId)}
                        >
                          セッション
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <h3>試験データなし</h3>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedExamId && (
        <SessionSetupModal
          isOpen={!!selectedExamId}
          onClose={() => setSelectedExamId(null)}
          examId={selectedExamId}
          modeStats={selectedExamModeStats}
        />
      )}
    </div>
  )
}