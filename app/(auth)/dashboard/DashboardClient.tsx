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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <Button variant="outline" asChild>
          <Link href="/exams">試験管理</Link>
        </Button>
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
                  <TableHead className="text-right">予習設問数</TableHead>
                  <TableHead className="text-right">復習設問数</TableHead>
                  <TableHead className="text-right">反復設問数</TableHead>
                  <TableHead className="text-right">日計セッション</TableHead>
                  <TableHead className="text-right">累計セッション</TableHead>
                  <TableHead></TableHead>
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
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="font-medium">試験データなし</h3>
            </div>
            <Button className="mt-4" asChild>
              <Link href="/exams">試験インポート</Link>
            </Button>
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