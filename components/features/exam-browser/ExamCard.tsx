'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, BookOpen, Target, Users } from 'lucide-react'
import Link from 'next/link'
import { LikeButton } from './LikeButton'
import { ShareToggle } from '../exam-manager/ShareToggle'
import { useAuth } from '@/components/shared/AuthProvider'

interface ExamCardProps {
  exam: {
    id: string
    title: string
    description: string | null
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    estimated_duration: number | null
    question_count: number
    is_public: boolean
    created_by: string
    created_at: string
    likes_count: number
    user_liked: boolean
    creator_name?: string
  }
  onLikeChange?: () => void
  onShareChange?: () => void
}

export function ExamCard({ exam, onLikeChange, onShareChange }: ExamCardProps) {
  const { user } = useAuth()
  const isOwner = user?.id === exam.created_by

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight mb-2 truncate">
              {exam.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {exam.description || 'No description available'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <LikeButton
              examId={exam.id}
              initialLiked={exam.user_liked}
              initialCount={exam.likes_count}
              onChange={onLikeChange}
            />
            {isOwner && (
              <ShareToggle
                examId={exam.id}
                initialShared={exam.is_public}
                onChange={onShareChange}
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge className={getDifficultyColor(exam.difficulty)}>
            {exam.difficulty}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <BookOpen className="h-3 w-3" />
            {exam.question_count} questions
          </div>
          {exam.estimated_duration && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-3 w-3" />
              {exam.estimated_duration}min
            </div>
          )}
        </div>

        {exam.creator_name && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
            <Users className="h-3 w-3" />
            by {exam.creator_name}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Button asChild className="w-full">
          <Link href={`/exam/${exam.id}`}>
            <Target className="mr-2 h-4 w-4" />
            Start Exam
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default ExamCard