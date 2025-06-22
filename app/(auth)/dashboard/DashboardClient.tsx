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
  const [sessionTime, setSessionTime] = useState(0)

  // リアルタイムタイマー
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1)
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
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">ダッシュボード</h1>
          <p className="page-description">学習進捗の分析</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* リアルタイムタイマー */}
        <Card>
          <CardHeader>
            <CardTitle>滞在時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tabular-nums">
              {formatTime(sessionTime)}
            </div>
          </CardContent>
        </Card>

        {/* アナリティクステーブル */}
        {analytics.length > 0 ? (
          <div className="grid gap-6">
            {analytics.map((exam) => (
              <Card key={exam.examId}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{exam.examTitle}</CardTitle>
                    <Button onClick={() => handleStartSession(exam.examId)}>
                      学習開始
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{exam.warmupCount}</div>
                      <div className="text-sm text-muted-foreground">予習</div>
                      <div className="text-xs text-muted-foreground">
                        日計: {exam.modeStats.warmup.attempts}回
                      </div>
                      <div className="text-xs text-muted-foreground">
                        累計: {exam.modeStats.warmup.attempts}回
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{exam.reviewCount}</div>
                      <div className="text-sm text-muted-foreground">復習</div>
                      <div className="text-xs text-muted-foreground">
                        日計: {exam.modeStats.review.attempts}回
                      </div>
                      <div className="text-xs text-muted-foreground">
                        累計: {exam.modeStats.review.attempts}回
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{exam.repetitionCount}</div>
                      <div className="text-sm text-muted-foreground">反復</div>
                      <div className="text-xs text-muted-foreground">
                        日計: {exam.modeStats.repetition.attempts}回
                      </div>
                      <div className="text-xs text-muted-foreground">
                        累計: {exam.modeStats.repetition.attempts}回
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{exam.modeStats.comprehensive.count}</div>
                      <div className="text-sm text-muted-foreground">総合</div>
                      <div className="text-xs text-muted-foreground">
                        日計: {exam.modeStats.comprehensive.attempts}回
                      </div>
                      <div className="text-xs text-muted-foreground">
                        累計: {exam.modeStats.comprehensive.attempts}回
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">試験データなし</h3>
                <p className="text-muted-foreground">試験管理から試験をインポートしてください</p>
              </div>
            </CardContent>
          </Card>
        )}
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