'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  const [dailyTime, setDailyTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)

  // リアルタイムタイマー
  useEffect(() => {
    const timer = setInterval(() => {
      setDailyTime(prev => prev + 1)
      setTotalTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">日計滞在時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatTime(dailyTime)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累計滞在時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatTime(totalTime)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>試験別アナリティクス</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              {analytics.length > 0 ? (
                <div className="space-y-8">
                  {analytics.map((exam) => (
                    <Card key={exam.examId}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{exam.examTitle}</CardTitle>
                          <Button 
                            onClick={() => handleStartSession(exam.examId)}
                            size="sm"
                          >
                            セッション開始
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[100px]"></TableHead>
                              <TableHead>予習</TableHead>
                              <TableHead>復習</TableHead>
                              <TableHead>反復</TableHead>
                              <TableHead>総合</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">日計</TableCell>
                              <TableCell>{exam.modeStats.warmup.attempts}回</TableCell>
                              <TableCell>{exam.modeStats.review.attempts}回</TableCell>
                              <TableCell>{exam.modeStats.repetition.attempts}回</TableCell>
                              <TableCell>{exam.modeStats.comprehensive.attempts}回</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">累計</TableCell>
                              <TableCell>{exam.modeStats.warmup.attempts}回</TableCell>
                              <TableCell>{exam.modeStats.review.attempts}回</TableCell>
                              <TableCell>{exam.modeStats.repetition.attempts}回</TableCell>
                              <TableCell>{exam.modeStats.comprehensive.attempts}回</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">設問数</TableCell>
                              <TableCell>{exam.warmupCount}問</TableCell>
                              <TableCell>{exam.reviewCount}問</TableCell>
                              <TableCell>{exam.repetitionCount}問</TableCell>
                              <TableCell>{exam.modeStats.comprehensive.count}問</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">試験データなし</h3>
                    <p className="text-sm text-muted-foreground">試験管理から試験をインポートしてください</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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