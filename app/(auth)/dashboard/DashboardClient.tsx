'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SessionStartButton } from '@/components/shared/SessionStartButton'
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
    warmup: { count: number; attempts: number; dailyAttempts: number }
    review: { count: number; attempts: number; dailyAttempts: number }
    repetition: { count: number; attempts: number; dailyAttempts: number }
    comprehensive: { count: number; attempts: number; dailyAttempts: number }
  }
}

interface DashboardClientProps {
  analytics: AnalyticsRow[]
}

export default function DashboardClient({ analytics }: DashboardClientProps) {
  const router = useRouter()
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

  // セッション完了後の画面更新
  useEffect(() => {
    const handleFocus = () => {
      router.refresh()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [router])

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

      <div className="space-y-4">
        <h3 className="text-lg font-medium">試験別アナリティクス</h3>
        
        {analytics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {analytics.map((exam) => (
              <Card key={exam.examId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{exam.examTitle}</CardTitle>
                    <SessionStartButton 
                      examId={exam.examId} 
                      modeStats={{
                        warmup: { count: exam.modeStats.warmup.count, attempts: exam.modeStats.warmup.attempts },
                        review: { count: exam.modeStats.review.count, attempts: exam.modeStats.review.attempts },
                        repetition: { count: exam.modeStats.repetition.count, attempts: exam.modeStats.repetition.attempts },
                        comprehensive: { count: exam.modeStats.comprehensive.count, attempts: exam.modeStats.comprehensive.attempts }
                      }}
                      size="sm"
                    >
                      セッション開始
                    </SessionStartButton>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]"></TableHead>
                        <TableHead className="text-center">予習</TableHead>
                        <TableHead className="text-center">復習</TableHead>
                        <TableHead className="text-center">反復</TableHead>
                        <TableHead className="text-center">総合</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">日計</TableCell>
                        <TableCell className="text-center">{exam.modeStats.warmup.dailyAttempts}回</TableCell>
                        <TableCell className="text-center">{exam.modeStats.review.dailyAttempts}回</TableCell>
                        <TableCell className="text-center">{exam.modeStats.repetition.dailyAttempts}回</TableCell>
                        <TableCell className="text-center">{exam.modeStats.comprehensive.dailyAttempts}回</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">累計</TableCell>
                        <TableCell className="text-center">{exam.modeStats.warmup.attempts}回</TableCell>
                        <TableCell className="text-center">{exam.modeStats.review.attempts}回</TableCell>
                        <TableCell className="text-center">{exam.modeStats.repetition.attempts}回</TableCell>
                        <TableCell className="text-center">{exam.modeStats.comprehensive.attempts}回</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">設問数</TableCell>
                        <TableCell className="text-center">{exam.warmupCount}問</TableCell>
                        <TableCell className="text-center">{exam.reviewCount}問</TableCell>
                        <TableCell className="text-center">{exam.repetitionCount}問</TableCell>
                        <TableCell className="text-center">{exam.modeStats.comprehensive.count}問</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">試験データなし</h3>
                <p className="text-sm text-muted-foreground">試験管理から試験をインポートしてください</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}