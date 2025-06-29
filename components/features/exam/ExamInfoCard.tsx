'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Tag, MoreHorizontal, Heart } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { SessionStartButton } from '@/components/shared/SessionStartButton'
import { ExamSet, ExamModeStats } from '@/lib/types'
import { DeleteExamButton } from '@/components/features/exam-manager/DeleteExamButton'
import { ExportExamButton } from '@/components/features/exam-manager/ExportExamButton'
import { ImportSharedExamButton } from '@/components/features/exam-browser/ImportSharedExamButton'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toggleExamLikeAction } from '@/lib/actions/exam'
import { updateExamSharedAction } from '@/lib/actions/exam'

interface ExamInfoCardProps {
  exam: ExamSet
  modeStats: ExamModeStats
  isShared?: boolean
  isOwner?: boolean
  showLikeButton?: boolean
  showShareToggle?: boolean
  showImportButton?: boolean
  className?: string
}

export function ExamInfoCard({
  exam,
  modeStats,
  isShared = false,
  isOwner = true,
  showLikeButton = false,
  showShareToggle = true,
  showImportButton = false,
  className
}: ExamInfoCardProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(exam.isLiked || false)
  const [likesCount, setLikesCount] = useState(exam.likes_count || 0)
  const [isPending, setIsPending] = useState(false)
  const [isSharedState, setIsSharedState] = useState(exam.is_shared)
  
  const questionCount = exam.data?.questions?.length || 0
  const tags = exam.data?.tags || []
  
  const handleToggleLike = async () => {
    if (isPending) return
    
    const newLikedState = !isLiked
    const newLikesCount = newLikedState ? likesCount + 1 : likesCount - 1
    
    setIsLiked(newLikedState)
    setLikesCount(newLikesCount)
    setIsPending(true)
    
    try {
      await toggleExamLikeAction(exam.id, isLiked)
    } catch (error) {
      // Revert on error
      setIsLiked(!newLikedState)
      setLikesCount(newLikedState ? newLikesCount - 1 : newLikesCount + 1)
      console.error('Failed to toggle like:', error)
    } finally {
      setIsPending(false)
    }
  }
  
  const handleToggleShared = async (checked: boolean) => {
    if (isPending) return
    
    setIsSharedState(checked)
    setIsPending(true)
    
    try {
      await updateExamSharedAction(exam.id, checked)
    } catch (error) {
      // Revert on error
      setIsSharedState(!checked)
      console.error('Failed to update shared status:', error)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card className={cn("data-card overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium line-clamp-1">{exam.title}</CardTitle>
          {showLikeButton && (
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={handleToggleLike}
              disabled={isPending}
              className="flex items-center gap-1 h-8 px-2"
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Calendar className="h-3 w-3" />
          {new Date(exam.created_at).toLocaleDateString()}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag.項目名}: {tag.値}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="mode-stat-card">
            <div className="text-sm font-medium mb-1">予習</div>
            <div className="text-lg font-bold">{modeStats.warmup.count}</div>
            <div className="text-xs text-muted-foreground">{modeStats.warmup.attempts}回</div>
          </div>
          <div className="mode-stat-card">
            <div className="text-sm font-medium mb-1">復習</div>
            <div className="text-lg font-bold">{modeStats.review.count}</div>
            <div className="text-xs text-muted-foreground">{modeStats.review.attempts}回</div>
          </div>
          <div className="mode-stat-card">
            <div className="text-sm font-medium mb-1">反復</div>
            <div className="text-lg font-bold">{modeStats.repetition.count}</div>
            <div className="text-xs text-muted-foreground">{modeStats.repetition.attempts}回</div>
          </div>
          <div className="mode-stat-card">
            <div className="text-sm font-medium mb-1">総合</div>
            <div className="text-lg font-bold">{modeStats.comprehensive.count}</div>
            <div className="text-xs text-muted-foreground">{modeStats.comprehensive.attempts}回</div>
          </div>
        </div>
        
        {showShareToggle && isOwner && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="text-sm">共有設定</div>
            <div className="flex items-center space-x-2">
              <Switch
                id={`share-${exam.id}`}
                checked={isSharedState}
                onCheckedChange={handleToggleShared}
                disabled={isPending}
              />
              <span className="text-sm">
                {isSharedState ? '共有中' : '非公開'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      
      <div className="exam-card-footer">
        <div className="flex items-center gap-2">
          {showImportButton && (
            <ImportSharedExamButton examId={exam.id} />
          )}
          <SessionStartButton 
            examId={exam.id} 
            modeStats={modeStats}
            size="sm"
            className={showImportButton ? "flex-1" : "w-full"}
          >
            開始
          </SessionStartButton>
          
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/exams/${exam.id}/edit`}>編集</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <ExportExamButton exam={exam} />
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <DeleteExamButton examId={exam.id} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </Card>
  )
}