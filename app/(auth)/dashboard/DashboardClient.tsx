'use client'

import { useAuth } from '@/components/shared/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SessionSetupModal } from '@/components/features/exam-session/SessionSetupModal'
import { ExamModeStats } from '@/lib/types'

interface DashboardStats {
  totalExams: number
  completedSessions: number
  averageScore: number
  studyTime: number
}

interface RecentActivity {
  id: string
  title: string
  score: number | null
  completed_at: string | null
  created_at: string
}

export default function DashboardClient() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    completedSessions: 0,
    averageScore: 0,
    studyTime: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [examModeStats, setExamModeStats] = useState<ExamModeStats>({
    warmup: { count: 0, attempts: 0 },
    review: { count: 0, attempts: 0 },
    repetition: { count: 0, attempts: 0 },
    comprehensive: { count: 0, attempts: 0 }
  })

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // 試験セット数を取得
      const { data: examSets, error: examError } = await supabase
        .from('exam_sets')
        .select('id, title, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (examError) throw examError

      // セッション結果を取得
      const { data: sessions, error: sessionError } = await supabase
        .from('session_results')
        .select('id, score, total_questions, end_time, created_at, exam_set_id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (sessionError) throw sessionError

      const totalExams = examSets?.length || 0
      const completedSessions = sessions?.filter(s => s.end_time).length || 0
      const scores = sessions?.filter(s => s.score !== null).map(s => s.score) || []
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      setStats({
        totalExams,
        completedSessions,
        averageScore: Math.round(averageScore),
        studyTime: completedSessions * 30
      })

      // 最近のアクティビティを作成
      const activities = sessions?.map(session => {
        const exam = examSets?.find(e => e.id === session.exam_set_id)
        return {
          id: session.id,
          title: exam?.title || '不明な試験',
          score: session.score,
          completed_at: session.end_time,
          created_at: session.created_at
        }
      }) || []

      setRecentActivity(activities)

    } catch (error) {
      console.error('ダッシュボードデータの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = (examId: string) => {
    setSelectedExamId(examId)
    // モード統計を取得（実際の実装では API から取得）
    setExamModeStats({
      warmup: { count: 15, attempts: 2 },
      review: { count: 8, attempts: 1 },
      repetition: { count: 12, attempts: 3 },
      comprehensive: { count: 35, attempts: 1 }
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1">学習状況の概要</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総試験数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <p className="text-xs text-muted-foreground">インポート済み</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了セッション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSessions}</div>
            <p className="text-xs text-muted-foreground">実行済み</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均スコア</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">全セッション平均</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学習時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.studyTime / 60)}h</div>
            <p className="text-xs text-muted-foreground">総投資時間</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
            <CardDescription>最新の学習セッション</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-500">
                        {activity.completed_at 
                          ? `完了: ${activity.score}%`
                          : '進行中'
                        }
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(activity.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>まだ学習セッションがありません</p>
                <p className="text-sm">最初の試験を開始してアクティビティを確認しましょう</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使う機能</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start">
              <Link href="/exams">
                試験管理
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/dashboard?tab=shared-exams">
                共有試験を見る
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {selectedExamId && (
        <SessionSetupModal
          isOpen={!!selectedExamId}
          onClose={() => setSelectedExamId(null)}
          examId={selectedExamId}
          modeStats={examModeStats}
        />
      )}
    </div>
  )
}