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
        .from('exam_sessions')
        .select(`
          id,
          score,
          completed_at,
          created_at,
          exams (
            id,
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      const totalExams = sessions?.length || 0
      const completedExams = sessions?.filter(s => s.completed_at).length || 0
      const scores = sessions?.filter(s => s.score !== null).map(s => s.score) || []
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

      setStats({
        totalExams,
        completedExams,
        averageScore: Math.round(averageScore),
        studyTime: completedExams * 45 // Estimate 45 minutes per completed exam
      })

      setRecentExams(sessions?.map(session => ({
        id: session.id,
        title: session.exams?.title || 'Unknown Exam',
        score: session.score,
        completed_at: session.completed_at,
        created_at: session.created_at
      })) || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
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
        title="Dashboard"
        description="Your exam preparation overview"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Attempts"
          value={stats.totalExams}
          icon={BookOpen}
          description="Exam sessions started"
        />
        <StatCard
          title="Completed"
          value={stats.completedExams}
          icon={Target}
          description="Exams finished"
        />
        <StatCard
          title="Avg Score"
          value={`${stats.averageScore}%`}
          icon={TrendingUp}
          description="Average performance"
        />
        <StatCard
          title="Study Time"
          value={`${Math.round(stats.studyTime / 60)}h`}
          icon={Clock}
          description="Total time invested"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest exam sessions</CardDescription>
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
                          ? `Completed: ${exam.score}%`
                          : 'In progress'
                        }
                      </p>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No exam sessions yet</p>
                <p className="text-sm">Start your first exam to see activity here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start">
              <Link href="/exams">
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Available Exams
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/exams?filter=recent">
                <Clock className="mr-2 h-4 w-4" />
                Continue Recent Session
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/exams?sort=popular">
                <TrendingUp className="mr-2 h-4 w-4" />
                Popular Exams
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}