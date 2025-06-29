'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toggleExamLikeAction } from '@/lib/actions/exam'
import { useToast } from '@/hooks/use-toast'

interface LikeButtonProps {
  examId: string
  initialLiked: boolean
  initialCount: number
}

export function LikeButton({ examId, initialLiked, initialCount }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [likesCount, setLikesCount] = useState(initialCount)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleToggleLike = () => {
    const newLikedState = !isLiked
    const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1
    
    setIsLiked(newLikedState)
    setLikesCount(newLikesCount)

    startTransition(async () => {
      const result = await toggleExamLikeAction(examId, isLiked)
      if (!result.success) {
        setIsLiked(!newLikedState)
        setLikesCount(newLikedState ? newLikesCount - 1 : newLikesCount + 1)
        toast({
          title: 'エラー',
          description: 'いいねの更新に失敗しました。',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      size="sm"
      onClick={handleToggleLike}
      disabled={isPending}
      className="flex items-center gap-2 h-8 px-2"
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      <span>{likesCount}</span>
    </Button>
  )
}