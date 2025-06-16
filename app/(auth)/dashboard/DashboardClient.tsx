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
  weeklyActivity: number[]
  recentSessions: Array<{
    id: string
    exam_title: string
    score: number
    total: number
    date: string
    mode: string
  }>
}

interface ExamAnalytics {
  id: string
  title: string
  totalQuestions: number
  completedQuestions: number
  accuracy: number
  lastSession: string | null
  modeStats: ExamModeStats
  sessionHistory: Array<{
    date: string
    score: number
    mode: string
  }>
}

export default function DashboardClient() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalExams: 0,
    totalQuestions: 0,
    completedSessions: 0,
    averageAccuracy: 0,
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
        .select('id, title, data, created_at')
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
      const recentSessions = sessions?.slice(0, 5).map(session => {
        const exam = examSets?.find(e => e.id === session.exam_set_id)
        return {
          id: session.id,
          exam_title: exam?.title || 'Unknown',
          score: session.score,
          total: session.total_questions,
          date: session.created_at,
          mode: session.session_mode
        }
      }) || []

      setAnalytics({
        totalExams,
        totalQuestions,
        completedSessions,
        averageAccuracy: Math.round(averageAccuracy),
        weeklyActivity,
        recentSessions
      })

      // 試験別分析
      const examAnalytics = examSets?.map(exam => {
        const examSessions = sessions?.filter(s => s.exam_set_id === exam.id) || []
        const examProgress = progress?.filter(p => p.exam_set_id === exam.id) || []
        
        const totalQuestions = exam.data?.questions?.length || 0
        const completedQuestions = examProgress.length
        const correctAnswers = examProgress.filter(p => p.last_result).length
        const accuracy = completedQuestions > 0 ? (correctAnswers / completedQuestions) * 100 : 0
        
        // モード別統計（簡易版）
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
          modeStats: {
            warmup: { count: warmupCount, attempts: 0 },
            review: { count: reviewCount, attempts: 0 },
            repetition: { count: repetitionCount, attempts: 0 },
            comprehensive: { count: totalQuestions, attempts: examSessions.length }
          },
          sessionHistory: examSessions.slice(0, 10).map(s => ({
            date: s.created_at,
            score: Math.round((s.score / s.total_questions) * 100),
            mode: s.session_mode
          }))
        }
      }) || []

      setExams(examAnalytics)

    } catch (error) {
      console.error('Analytics load error:', error)
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
      <div className="space-y-6">
        <div className="analytics-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="exam-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Performance metrics and insights</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/exams">Manage</Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="analytics-grid">
        <Card className="metric-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">TOTAL EXAMS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalExams}</div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">QUESTIONS POOL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalQuestions}</div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">SESSIONS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedSessions}</div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">ACCURACY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageAccuracy}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
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
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exam Analytics */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Exam Performance</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/exams">View All</Link>
          </Button>
        </div>
        
        {exams.length > 0 ? (
          <div className="exam-grid">
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
                <h3 className="font-medium">No exams imported</h3>
                <p className="text-sm text-muted-foreground">Import exam data to start analytics</p>
              </div>
              <Button className="mt-4" asChild>
                <Link href="/exams">Import Exam</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Sessions */}
      {analytics.recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Mode</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="font-medium">{session.exam_title}</td>
                    <td>{session.score}/{session.total}</td>
                    <td>
                      <Badge variant="outline" className="text-xs">
                        {session.mode}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(session.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

  return (
    <Card 
      className="exam-card"
      onClick={() => onStartSession(exam.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {exam.title}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {exam.totalQuestions} questions
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">{exam.accuracy}%</div>
            <div className="text-xs text-muted-foreground">accuracy</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="mode-stats">
          <div className="mode-stat">
            <div className="font-medium">{exam.modeStats.warmup.count}</div>
            <div className="text-muted-foreground">New</div>
          </div>
          <div className="mode-stat">
            <div className="font-medium">{exam.modeStats.review.count}</div>
            <div className="text-muted-foreground">Review</div>
          </div>
          <div className="mode-stat">
            <div className="font-medium">{exam.modeStats.repetition.count}</div>
            <div className="text-muted-foreground">Repeat</div>
          </div>
          <div className="mode-stat">
            <div className="font-medium">{exam.modeStats.comprehensive.attempts}</div>
            <div className="text-muted-foreground">Sessions</div>
          </div>
        </div>

        {exam.lastSession && (
          <div className="text-xs text-muted-foreground">
            Last: {new Date(exam.lastSession).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}