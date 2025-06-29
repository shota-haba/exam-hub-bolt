'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SessionStartButton } from '@/components/shared/SessionStartButton'
import { PointsDisplay } from '@/components/features/gamification/PointsDisplay'
import { ExamModeStats } from '@/lib/types'
import { Clock, Timer, Calendar, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
    <div className="content-container">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>
      
      {/* ゲーミフィケーション表示 */}
      <PointsDisplay
        totalPoints={totalPoints}
        dailyPoints={dailyPoints}
        level={userLevel}
        currentExp={currentExp}
        expToNext={expToNext}
        className="mb-6"
      />
      
      {/* 滞在時間統計 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="data-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">日計滞在時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatTime(dailyTime)}</div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">累計滞在時間</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatTime(totalTime)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 試験別アナリティクス */}
      <div className="space-y-4">
        <h3 className="section-title">試験別アナリティクス</h3>
        
        {analytics.length > 0 ? (
          <div className="card-grid">
            {analytics.map((exam) => (
              <Card key={exam.examId} className="data-card overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium truncate">{exam.examTitle}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>累計: {exam.totalSessions}回</span>
                    <span className="mx-1">•</span>
                    <span>日計: {exam.dailySessions}回</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="text-sm font-medium mb-1">予習</div>
                      <div className="text-lg font-bold">{exam.modeStats.warmup.count}</div>
                      <div className="text-xs text-muted-foreground">{exam.modeStats.warmup.attempts}回</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="text-sm font-medium mb-1">復習</div>
                      <div className="text-lg font-bold">{exam.modeStats.review.count}</div>
                      <div className="text-xs text-muted-foreground">{exam.modeStats.review.attempts}回</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="text-sm font-medium mb-1">反復</div>
                      <div className="text-lg font-bold">{exam.modeStats.repetition.count}</div>
                      <div className="text-xs text-muted-foreground">{exam.modeStats.repetition.attempts}回</div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="text-sm font-medium mb-1">総合</div>
                      <div className="text-lg font-bold">{exam.modeStats.comprehensive.count}</div>
                      <div className="text-xs text-muted-foreground">{exam.modeStats.comprehensive.attempts}回</div>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 py-3 bg-muted/30 border-t">
                  <SessionStartButton 
                    examId={exam.examId} 
                    modeStats={{
                      warmup: { count: exam.modeStats.warmup.count, attempts: exam.modeStats.warmup.attempts },
                      review: { count: exam.modeStats.review.count, attempts: exam.modeStats.review.attempts },
                      repetition: { count: exam.modeStats.repetition.count, attempts: exam.modeStats.repetition.attempts },
                      comprehensive: { count: exam.modeStats.comprehensive.count, attempts: exam.modeStats.comprehensive.attempts }
                    }}
                    size="sm"
                    className="w-full"
                  >
                    開始
                  </SessionStartButton>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-8">
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