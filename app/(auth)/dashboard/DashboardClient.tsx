'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SessionStartButton } from '@/components/shared/SessionStartButton'
import { PointsDisplay } from '@/components/features/gamification/PointsDisplay'
import { ExamModeStats } from '@/lib/types'
import { Clock, Timer } from 'lucide-react'

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
  const pathname = usePathname()
  const [dailyTime, setDailyTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)

  // 滞在時間の永続化とリアルタイムカウンター
  useEffect(() => {
    // 初期化: localStorageから累計時間を読み込み
    const savedTotalTime = localStorage.getItem('examhub_total_time')
    if (savedTotalTime) {
      setTotalTime(parseInt(savedTotalTime, 10))
    }

    // 日計時間の初期化（今日の日付をキーとして使用）
    const today = new Date().toDateString()
    const savedDailyTime = localStorage.getItem(`examhub_daily_time_${today}`)
    if (savedDailyTime) {
      setDailyTime(parseInt(savedDailyTime, 10))
    }

    // リアルタイムタイマー
    const timer = setInterval(() => {
      setDailyTime(prev => {
        const newDailyTime = prev + 1
        localStorage.setItem(`examhub_daily_time_${today}`, newDailyTime.toString())
        return newDailyTime
      })
      setTotalTime(prev => {
        const newTotalTime = prev + 1
        localStorage.setItem('examhub_total_time', newTotalTime.toString())
        return newTotalTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // セッション完了後の画面更新（ダッシュボードページでのみ実行）
  useEffect(() => {
    const handleFocus = () => {
      // ダッシュボードページにいる場合のみリフレッシュ
      if (pathname === '/dashboard') {
        router.refresh()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [router, pathname])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ゲーミフィケーション用のダミーデータ（実際の実装では適切なデータソースから取得）
  const userLevel = 12
  const currentExp = 75
  const expToNext = 25
  const totalPoints = 2450
  const dailyPoints = 85

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {/* ゲーミフィケーション表示 */}
      <PointsDisplay
        totalPoints={totalPoints}
        dailyPoints={dailyPoints}
        level={userLevel}
        currentExp={currentExp}
        expToNext={expToNext}
      />
      
      {/* 滞在時間統計 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">日計滞在時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatTime(dailyTime)}</div>
            <p className="text-xs text-muted-foreground mt-1">今日の学習時間</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">累計滞在時間</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatTime(totalTime)}</div>
            <p className="text-xs text-muted-foreground mt-1">総学習時間</p>
          </CardContent>
        </Card>
      </div>

      {/* 試験別アナリティクス */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">試験別アナリティクス</h3>
        
        {analytics.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {analytics.map((exam) => (
              <Card key={exam.examId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{exam.examTitle}</CardTitle>
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
                        <TableHead className="w-20"></TableHead>
                        <TableHead className="text-center">予習</TableHead>
                        <TableHead className="text-center">復習</TableHead>
                        <TableHead className="text-center">反復</TableHead>
                        <TableHead className="text-center">総合</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium text-sm">日計</TableCell>
                        <TableCell className="text-center text-sm">{exam.modeStats.warmup.dailyAttempts}回</TableCell>
                        <TableCell className="text-center text-sm">{exam.modeStats.review.dailyAttempts}回</TableCell>
                        <TableCell className="text-center text-sm">{exam.modeStats.repetition.dailyAttempts}回</TableCell>
                        <TableCell className="text-center text-sm">{exam.modeStats.comprehensive.dailyAttempts}回</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-sm">累計</TableCell>
                        <TableCell className="text-center text-sm">{exam.modeStats.warmup.attempts}回</TableCell>
                        <TableCell className="text-center text-sm">{exam.modeStats.review.attempts}回</TableCell>
                        <TableCell className="text-center text-sm">{exam.modeStats.repetition.attempts}回</TableCell>
                        <TableCell className="text-center text-sm">{exam.modeStats.comprehensive.attempts}回</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium text-sm">設問数</TableCell>
                        <TableCell className="text-center text-sm">{exam.warmupCount}問</TableCell>
                        <TableCell className="text-center text-sm">{exam.reviewCount}問</TableCell>
                        <TableCell className="text-center text-sm">{exam.repetitionCount}問</TableCell>
                        <TableCell className="text-center text-sm">{exam.modeStats.comprehensive.count}問</TableCell>
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
              <div className="text-center space-y-3">
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