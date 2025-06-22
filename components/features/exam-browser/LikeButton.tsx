'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toggleExamLikeAction } from '@/actions/exam'

interface LikeButtonProps {
  examId: string
  initialLiked: boolean
  initialCount: number
  onChange?: () => void
}

export function LikeButton({ examId, initialLiked, initialCount, onChange }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [currentLikesCount, setCurrentLikesCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()

  const handleToggleLike = () => {
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    setCurrentLikesCount(prev => newLikedState ? prev + 1 : prev - 1)

    startTransition(async () => {
      const result = await toggleExamLikeAction(examId, isLiked)
      if (!result.success) {
        setIsLiked(!newLikedState)
        setCurrentLikesCount(prev => newLikedState ? prev - 1 : prev + 1)
      } else if (onChange) {
        onChange()
      }
    })
  }

  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      size="sm"
      onClick={handleToggleLike}
      disabled={isPending}
      className="flex items-center gap-2"
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      <span>{currentLikesCount}</span>
    </Button>
  )
}