'use client'

import { useAuth } from '@/components/shared/AuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface ExamWithStats {
  id: string
  title: string
  questionCount: number
  progress: number
  lastStudied: string | null
  modeStats: ExamModeStats
}

export default function DashboardClient() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    completedSessions: 0,
    averageScore: 0,
    studyTime: 0
  })
  const [exams, setExams] = useState<ExamWithStats[]>([])
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
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      const { data: examSets, error: examError } = await supabase
        .from('exam_sets')
        .select('id, title, data, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(6)

      if (examError) throw examError

      const { data: sessions, error: sessionError } = await supabase
        .from('session_results')
        .select('score, total_questions, end_time, created_at, exam_set_id')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (sessionError) throw sessionError

      const totalExams = examSets?.length || 0
      const completedSessions = sessions?.filter(s => s.end_time).length || 0
      const scores = sessions?.filter(s => s.score !== null).map(s => (s.score / s.total_questions) * 100) || []
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      setStats({
        totalExams,
        completedSessions,
        averageScore: Math.round(averageScore),
        studyTime: completedSessions * 25
      })

      const examsWithStats = examSets?.map(exam => {
        const questionCount = exam.data?.questions?.length || 0
        const examSessions = sessions?.filter(s => s.exam_set_id === exam.id) || []
        const lastSession = examSessions[0]
        
        return {
          id: exam.id,
          title: exam.title,
          questionCount,
          progress: Math.floor(Math.random() * 100),
          lastStudied: lastSession?.created_at || null,
          modeStats: {
            warmup: { count: Math.floor(questionCount * 0.4), attempts: 0 },
            review: { count: Math.floor(questionCount * 0.2), attempts: 0 },
            repetition: { count: Math.floor(questionCount * 0.3), attempts: 0 },
            comprehensive: { count: questionCount, attempts: 0 }
          }
        }
      }) || []

      setExams(examsWithStats)

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
      setSelectedExamModeStats(exam.modeStats)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="dashboard-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="exam-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-1">学習状況の概要</p>
        </div>
        <Button asChild>
          <Link href="/exams">試験管理</Link>
        </Button>
      </div>

      <div className="dashboard-grid">
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">総試験数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalExams}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">完了セッション</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.completedSessions}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均スコア</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.averageScore}%</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">学習時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{Math.round(stats.studyTime / 60)}h</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">最近の試験</h2>
          <Button variant="outline" asChild>
            <Link href="/exams">すべて表示</Link>
          </Button>
        </div>
        
        {exams.length > 0 ? (
          <div className="exam-grid">
            {exams.map((exam) => (
              <ExamCard 
                key={exam.id} 
                exam={exam} 
                onStartSession={handleStartSession}
              />
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-gray-300 rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 bg-gray-100 rounded-xl mb-6 flex items-center justify-center">
                <div className="h-8 w-8 bg-gray-300 rounded"></div>
              </div>
              <h3 className="text-xl font-medium mb-3 text-gray-900">試験がありません</h3>
              <p className="text-gray-600 text-center mb-8 max-w-md">
                試験管理ページから問題集をインポートしてください
              </p>
              <Button asChild>
                <Link href="/exams">試験をインポート</Link>
              </Button>
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

function ExamCard({ exam, onStartSession }: { 
  exam: ExamWithStats
  onStartSession: (examId: string) => void 
}) {
  const progressColor = exam.progress >= 80 ? 'text-green-600' : 
                       exam.progress >= 50 ? 'text-yellow-600' : 'text-red-600'

  return (
    <Card 
      className="exam-card group"
      onClick={() => onStartSession(exam.id)}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              {exam.title}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {exam.questionCount}問
            </p>
          </div>
          <div className="progress-ring">
            <svg className="w-16 h-16" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="3"
                fill="transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={progressColor}
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${exam.progress}, 100`}
                strokeLinecap="round"
                fill="transparent"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-semibold ${progressColor}`}>
                {exam.progress}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="mode-badge warmup">
            予習 {exam.modeStats.warmup.count}
          </span>
          <span className="mode-badge review">
            復習 {exam.modeStats.review.count}
          </span>
          <span className="mode-badge repetition">
            反復 {exam.modeStats.repetition.count}
          </span>
        </div>
        
        {exam.lastStudied && (
          <p className="text-xs text-gray-500">
            最終学習: {new Date(exam.lastStudied).toLocaleDateString('ja-JP')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}