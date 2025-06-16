'use client'

import { useAuth } from '@/components/shared/AuthProvider'
import { StatCard } from '@/components/shared/StatCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, Target, TrendingUp, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface DashboardStats {
  totalExams: number
  completedExams: number
  averageScore: number
  studyTime: number
}

interface RecentExam {
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
    completedExams: 0,
    averageScore: 0,
    studyTime: 0
  })
  const [recentExams, setRecentExams] = useState<RecentExam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Load user exam sessions
      const { data: sessions, error } = await supabase
        .from('session_results')
        .select(`
          id,
          score,
          end_time,
          created_at,
          exam_sets (
            id,
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      const totalExams = sessions?.length || 0
      const completedExams = sessions?.filter(s => s.end_time).length || 0
      const scores = sessions?.filter(s => s.score !== null).map(s => s.score) || []
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      setStats({
        totalExams,
        completedExams,
        averageScore: Math.round(averageScore),
        studyTime: completedExams * 45 // 完了した試験1つあたり45分と推定
      })

      setRecentExams(sessions?.map(session => ({
        id: session.id,
        title: session.exam_sets?.title || '不明な試験',
        score: session.score,
        completed_at: session.end_time,
        created_at: session.created_at
      })) || [])

    } catch (error) {
      console.error('ダッシュボードデータの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
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
      <PageHeader
        title="ダッシュボード"
        description="学習状況の概要"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="総試行数"
          value={stats.totalExams}
          icon={BookOpen}
          description="開始したセッション数"
        />
        <StatCard
          title="完了数"
          value={stats.completedExams}
          icon={Target}
          description="完了した試験数"
        />
        <StatCard
          title="平均スコア"
          value={`${stats.averageScore}%`}
          icon={TrendingUp}
          description="平均パフォーマンス"
        />
        <StatCard
          title="学習時間"
          value={`${Math.round(stats.studyTime / 60)}h`}
          icon={Clock}
          description="総投資時間"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
            <CardDescription>最新の試験セッション</CardDescription>
          </CardHeader>
          <CardContent>
            {recentExams.length > 0 ? (
              <div className="space-y-4">
                {recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-sm text-gray-500">
                        {exam.completed_at 
                          ? `完了: ${exam.score}%`
                          : '進行中'
                        }
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(exam.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>まだ試験セッションがありません</p>
                <p className="text-sm">最初の試験を開始してアクティビティを確認しましょう</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使う機能とショートカット</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start">
              <Link href="/exams">
                <BookOpen className="mr-2 h-4 w-4" />
                利用可能な試験を見る
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/exams?filter=recent">
                <Clock className="mr-2 h-4 w-4" />
                最近のセッションを続ける
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/exams?sort=popular">
                <TrendingUp className="mr-2 h-4 w-4" />
                人気の試験
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}