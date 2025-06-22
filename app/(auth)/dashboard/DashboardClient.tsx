'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
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
  modeStats: ExamModeStats
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
      setSelectedExamModeStats(exam.modeStats)
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>試験タイトル</TableHead>
                  <TableHead className="text-right w-20">予習</TableHead>
                  <TableHead className="text-right w-20">復習</TableHead>
                  <TableHead className="text-right w-20">反復</TableHead>
                  <TableHead className="text-right w-20">日計</TableHead>
                  <TableHead className="text-right w-20">累計</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.map((row) => (
                  <TableRow key={row.examId}>
                    <TableCell className="font-medium">{row.examTitle}</TableCell>
                    <TableCell className="text-right">{row.warmupCount}</TableCell>
                    <TableCell className="text-right">{row.reviewCount}</TableCell>
                    <TableCell className="text-right">{row.repetitionCount}</TableCell>
                    <TableCell className="text-right">{row.dailySessions}</TableCell>
                    <TableCell className="text-right">{row.totalSessions}</TableCell>
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <h3>試験データなし</h3>
              <Button asChild>
                <Link href="/exams">試験インポート</Link>
              </Button>
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