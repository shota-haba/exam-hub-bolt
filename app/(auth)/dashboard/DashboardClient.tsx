'use client'

import { useAuth } from '@/components/shared/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SessionSetupModal } from '@/components/features/exam-session/SessionSetupModal'
import { ExamModeStats } from '@/lib/types'

interface AnalyticsData {
  totalExams: number
  totalQuestions: number
  completedSessions: number
  averageAccuracy: number
  totalLoginDays: number
  currentStreak: number
  totalStudyTime: number
  averageSessionTime: number
  weeklyActivity: number[]
  recentSessions: Array<{
    id: string
    exam_title: string
    score: number
    total: number
    date: string
    mode: string
    duration: number
  }>
}

interface ExamAnalytics {
  id: string
  title: string
  totalQuestions: number
  completedQuestions: number
  accuracy: number
  lastSession: string | null
  registeredDate: string
  totalSessions: number
  averageScore: number
  averageTime: number
  isShared: boolean
  likesCount: number
  modeStats: ExamModeStats & {
    warmup: { count: number; attempts: number; avgScore: number }
    review: { count: number; attempts: number; avgScore: number }
    repetition: { count: number; attempts: number; avgScore: number }
    comprehensive: { count: number; attempts: number; avgScore: number }
  }
  sessionHistory: Array<{
    date: string
    score: number
    mode: string
    duration: number
  }>
}

export default function DashboardClient() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalExams: 0,
    totalQuestions: 0,
    completedSessions: 0,
    averageAccuracy: 0,
    totalLoginDays: 0,
    currentStreak: 0,
    totalStudyTime: 0,
    averageSessionTime: 0,
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    recentSessions: []
  })
  const [exams, setExams] = useState<ExamAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [selectedExamModeStats, setSelectedExamModeStats] = useState<ExamModeStats>({
    warmup: { count: 0, attempts: 0 },
    review: { count: 0, attempts: 0 },
    repetition: { count: 0, attempts: 0 },
    comprehensive: { count: 0, attempts: 0 }
  })

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user])

  const loadAnalytics = async () => {
    try {
      const { data: examSets, error: examError } = await supabase
        .from('exam_sets')
        .select('id, title, data, created_at, is_shared, likes_count')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (examError) throw examError

      const { data: sessions, error: sessionError } = await supabase
        .from('session_results')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (sessionError) throw sessionError

      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id)

      if (progressError) throw progressError

      // 基本統計
      const totalExams = examSets?.length || 0
      const totalQuestions = examSets?.reduce((sum, exam) => 
        sum + (exam.data?.questions?.length || 0), 0) || 0
      const completedSessions = sessions?.length || 0
      
      const accuracyScores = sessions?.map(s => (s.score / s.total_questions) * 100) || []
      const averageAccuracy = accuracyScores.length > 0 
        ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length 
        : 0

      // 学習時間統計
      const totalStudyTime = sessions?.reduce((total, session) => {
        const start = new Date(session.start_time).getTime()
        const end = new Date(session.end_time).getTime()
        return total + (end - start) / 1000
      }, 0) || 0

      const averageSessionTime = completedSessions > 0 ? totalStudyTime / completedSessions : 0

      // ログイン日数計算（簡易版）
      const uniqueDays = new Set(sessions?.map(s => 
        new Date(s.created_at).toDateString()
      )).size
      
      // 週間アクティビティ（過去7日）
      const weeklyActivity = Array(7).fill(0)
      const now = new Date()
      sessions?.forEach(session => {
        const sessionDate = new Date(session.created_at)
        const daysDiff = Math.floor((now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff < 7) {
          weeklyActivity[6 - daysDiff]++
        }
      })

      // 最近のセッション
      const recentSessions = sessions?.slice(0, 10).map(session => {
        const exam = examSets?.find(e => e.id === session.exam_set_id)
        const start = new Date(session.start_time).getTime()
        const end = new Date(session.end_time).getTime()
        const duration = (end - start) / 1000
        
        return {
          id: session.id,
          exam_title: exam?.title || '不明',
          score: session.score,
          total: session.total_questions,
          date: session.created_at,
          mode: session.session_mode,
          duration: Math.round(duration)
        }
      }) || []

      setAnalytics({
        totalExams,
        totalQuestions,
        completedSessions,
        averageAccuracy: Math.round(averageAccuracy),
        totalLoginDays: uniqueDays,
        currentStreak: 7, // 簡易実装
        totalStudyTime: Math.round(totalStudyTime),
        averageSessionTime: Math.round(averageSessionTime),
        weeklyActivity,
        recentSessions
      })

      // 試験別詳細分析
      const examAnalytics = examSets?.map(exam => {
        const examSessions = sessions?.filter(s => s.exam_set_id === exam.id) || []
        const examProgress = progress?.filter(p => p.exam_set_id === exam.id) || []
        
        const totalQuestions = exam.data?.questions?.length || 0
        const completedQuestions = examProgress.length
        const correctAnswers = examProgress.filter(p => p.last_result).length
        const accuracy = completedQuestions > 0 ? (correctAnswers / completedQuestions) * 100 : 0
        
        // セッション統計
        const totalSessions = examSessions.length
        const averageScore = examSessions.length > 0 
          ? examSessions.reduce((sum, s) => sum + (s.score / s.total_questions * 100), 0) / examSessions.length
          : 0
        
        const averageTime = examSessions.length > 0
          ? examSessions.reduce((total, session) => {
              const start = new Date(session.start_time).getTime()
              const end = new Date(session.end_time).getTime()
              return total + ((end - start) / 1000 / session.total_questions)
            }, 0) / examSessions.length
          : 0

        // モード別統計
        const modeSessionsMap = examSessions.reduce((acc, session) => {
          if (!acc[session.session_mode]) {
            acc[session.session_mode] = []
          }
          acc[session.session_mode].push(session)
          return acc
        }, {} as Record<string, any[]>)

        const progressMap = new Map(examProgress.map(p => [p.question_id, p.last_result]))
        const warmupCount = totalQuestions - completedQuestions
        const reviewCount = examProgress.filter(p => !p.last_result).length
        const repetitionCount = examProgress.filter(p => p.last_result).length
        
        return {
          id: exam.id,
          title: exam.title,
          totalQuestions,
          completedQuestions,
          accuracy: Math.round(accuracy),
          lastSession: examSessions[0]?.created_at || null,
          registeredDate: exam.created_at,
          totalSessions,
          averageScore: Math.round(averageScore),
          averageTime: Math.round(averageTime),
          isShared: exam.is_shared,
          likesCount: exam.likes_count,
          modeStats: {
            warmup: { 
              count: warmupCount, 
              attempts: modeSessionsMap.warmup?.length || 0,
              avgScore: modeSessionsMap.warmup?.length > 0 
                ? Math.round(modeSessionsMap.warmup.reduce((sum, s) => sum + (s.score / s.total_questions * 100), 0) / modeSessionsMap.warmup.length)
                : 0
            },
            review: { 
              count: reviewCount, 
              attempts: modeSessionsMap.review?.length || 0,
              avgScore: modeSessionsMap.review?.length > 0 
                ? Math.round(modeSessionsMap.review.reduce((sum, s) => sum + (s.score / s.total_questions * 100), 0) / modeSessionsMap.review.length)
                : 0
            },
            repetition: { 
              count: repetitionCount, 
              attempts: modeSessionsMap.repetition?.length || 0,
              avgScore: modeSessionsMap.repetition?.length > 0 
                ? Math.round(modeSessionsMap.repetition.reduce((sum, s) => sum + (s.score / s.total_questions * 100), 0) / modeSessionsMap.repetition.length)
                : 0
            },
            comprehensive: { 
              count: totalQuestions, 
              attempts: modeSessionsMap.comprehensive?.length || 0,
              avgScore: modeSessionsMap.comprehensive?.length > 0 
                ? Math.round(modeSessionsMap.comprehensive.reduce((sum, s) => sum + (s.score / s.total_questions * 100), 0) / modeSessionsMap.comprehensive.length)
                : 0
            }
          },
          sessionHistory: examSessions.slice(0, 10).map(s => {
            const start = new Date(s.start_time).getTime()
            const end = new Date(s.end_time).getTime()
            return {
              date: s.created_at,
              score: Math.round((s.score / s.total_questions) * 100),
              mode: s.session_mode,
              duration: Math.round((end - start) / 1000)
            }
          })
        }
      }) || []

      setExams(examAnalytics)

    } catch (error) {
      console.error('ダッシュボードデータの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = (examId: string) => {
    const exam = exams.find(e => e.id === examId)
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
    if (hours > 0) return `${hours}時間${minutes}分`
    return `${minutes}分`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">分析ダッシュボード</h1>
          <p className="text-sm text-muted-foreground">学習パフォーマンス分析</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/exams">試験管理</Link>
        </Button>
      </div>

      {/* KPI指標 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">試験数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalExams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">問題数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalQuestions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">セッション数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">平均正答率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageAccuracy}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">学習時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(analytics.totalStudyTime)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">ログイン日数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLoginDays}</div>
          </CardContent>
        </Card>
      </div>

      {/* 週間アクティビティ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">週間アクティビティ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-1 h-16">
            {analytics.weeklyActivity.map((count, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-foreground rounded-sm"
                  style={{ height: `${Math.max(count * 8, 2)}px` }}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {['月', '火', '水', '木', '金', '土', '日'][index]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 試験別分析 */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">試験別パフォーマンス</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/exams">すべて表示</Link>
          </Button>
        </div>
        
        {exams.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <ExamAnalyticsCard 
                key={exam.id} 
                exam={exam} 
                onStartSession={handleStartSession}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <h3 className="font-medium">試験データなし</h3>
                <p className="text-sm text-muted-foreground">試験データをインポートして分析を開始</p>
              </div>
              <Button className="mt-4" asChild>
                <Link href="/exams">試験インポート</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 最近のセッション */}
      {analytics.recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">最近のセッション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">試験</th>
                    <th className="text-left py-2">スコア</th>
                    <th className="text-left py-2">モード</th>
                    <th className="text-left py-2">時間</th>
                    <th className="text-left py-2">日付</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentSessions.map((session) => (
                    <tr key={session.id} className="border-b">
                      <td className="py-2 font-medium">{session.exam_title}</td>
                      <td className="py-2">{session.score}/{session.total}</td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-xs">
                          {session.mode}
                        </Badge>
                      </td>
                      <td className="py-2">{formatTime(session.duration)}</td>
                      <td className="py-2 text-muted-foreground">
                        {new Date(session.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

function ExamAnalyticsCard({ exam, onStartSession }: { 
  exam: ExamAnalytics
  onStartSession: (examId: string) => void 
}) {
  const completionRate = exam.totalQuestions > 0 
    ? (exam.completedQuestions / exam.totalQuestions) * 100 
    : 0

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    return `${Math.floor(seconds / 60)}分`
  }

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onStartSession(exam.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {exam.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {exam.totalQuestions}問
              </p>
              {exam.isShared && (
                <Badge variant="secondary" className="text-xs">
                  共有中 ({exam.likesCount})
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{exam.accuracy}%</div>
            <div className="text-xs text-muted-foreground">正答率</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>進捗</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="h-1.5 rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">{exam.modeStats.warmup.count}</div>
            <div className="text-muted-foreground">新規</div>
            <div className="text-xs">{exam.modeStats.warmup.attempts}回</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">{exam.modeStats.review.count}</div>
            <div className="text-muted-foreground">復習</div>
            <div className="text-xs">{exam.modeStats.review.attempts}回</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">{exam.modeStats.repetition.count}</div>
            <div className="text-muted-foreground">反復</div>
            <div className="text-xs">{exam.modeStats.repetition.attempts}回</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="font-medium">{exam.modeStats.comprehensive.attempts}</div>
            <div className="text-muted-foreground">総合</div>
            <div className="text-xs">{exam.totalSessions}回</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">平均スコア</div>
            <div className="font-medium">{exam.averageScore}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">平均時間</div>
            <div className="font-medium">{formatTime(exam.averageTime)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">登録日</div>
            <div className="font-medium">{new Date(exam.registeredDate).toLocaleDateString()}</div>
          </div>
        </div>

        {exam.lastSession && (
          <div className="text-xs text-muted-foreground border-t pt-2">
            最終セッション: {new Date(exam.lastSession).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}