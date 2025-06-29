'use client'

import { useState } from 'react'
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

interface DetailedModeStats {
  count: number
  attempts: number
  dailyPoints: number
  totalPoints: number
  lastStudyDate?: string
}

interface ExamInfoCardProps {
  exam: ExamSet
  modeStats: ExamModeStats
  detailedStats?: {
    warmup: DetailedModeStats
    review: DetailedModeStats
    repetition: DetailedModeStats
    comprehensive: DetailedModeStats
  }
  isOwner?: boolean
  showLikeButton?: boolean
  showShareToggle?: boolean
  showImportButton?: boolean
  className?: string
}

export function ExamInfoCard({
  exam,
  modeStats,
  detailedStats,
  isOwner = true,
  showLikeButton = false,
  showShareToggle = true,
  showImportButton = false,
  className
}: ExamInfoCardProps) {
  const [isLiked, setIsLiked] = useState(exam.isLiked || false)
  const [likesCount, setLikesCount] = useState(exam.likes_count || 0)
  const [isFavorited, setIsFavorited] = useState(exam.is_favorited || false)
  const [isPending, setIsPending] = useState(false)
  const [isSharedState, setIsSharedState] = useState(exam.is_shared)
  
  const questionCount = exam.data?.questions?.length || 0
  const tags = exam.data?.tags || []
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\//g, '/').replace(',', '')
  }
  
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
      setIsLiked(!newLikedState)
      setLikesCount(newLikedState ? newLikesCount - 1 : newLikesCount + 1)
      console.error('Failed to toggle like:', error)
    } finally {
      setIsPending(false)
    }
  }
  
  const handleToggleFavorite = async () => {
    if (isPending) return
    
    setIsFavorited(!isFavorited)
    setIsPending(true)
    
    try {
      // TODO: Implement favorite toggle action
      // await toggleExamFavoriteAction(exam.id, isFavorited)
    } catch (error) {
      setIsFavorited(!isFavorited)
      console.error('Failed to toggle favorite:', error)
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
      setIsSharedState(!checked)
      console.error('Failed to update shared status:', error)
    } finally {
      setIsPending(false)
    }
  }

  const renderModeStats = (mode: string, stats: any, detailed?: DetailedModeStats) => (
    <div className="mode-stat-card">
      <div className="text-sm font-medium mb-1">{mode}</div>
      <div className="text-lg font-bold">{stats.count}</div>
      <div className="text-xs text-muted-foreground mb-1">全{questionCount}問</div>
      <div className="text-xs text-muted-foreground">{stats.attempts} Pt</div>
      {detailed && (
        <>
          <div className="text-xs text-muted-foreground mt-1">
            日計: {detailed.dailyPoints} Pt
          </div>
          <div className="text-xs text-muted-foreground">
            累計: {detailed.totalPoints} Pt
          </div>
          {detailed.lastStudyDate && (
            <div className="text-xs text-muted-foreground mt-1">
              最終: {formatDateTime(detailed.lastStudyDate)}
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <Card className={cn("data-card overflow-hidden h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium line-clamp-1 flex-1 mr-2">
            {exam.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {isOwner && (
              <Button
                variant={isFavorited ? "default" : "outline"}
                size="sm"
                onClick={handleToggleFavorite}
                disabled={isPending}
                className="h-8 w-8 p-0"
              >
                <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
              </Button>
            )}
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
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            登録: {formatDateTime(exam.created_at)}
          </div>
          {exam.updated_at && exam.updated_at !== exam.created_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              更新: {formatDateTime(exam.updated_at)}
            </div>
          )}
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
      
      <CardContent className="pb-4 flex-1">
        <div className="grid grid-cols-2 gap-3">
          {renderModeStats('予習', modeStats.warmup, detailedStats?.warmup)}
          {renderModeStats('復習', modeStats.review, detailedStats?.review)}
          {renderModeStats('反復', modeStats.repetition, detailedStats?.repetition)}
          {renderModeStats('総合', modeStats.comprehensive, detailedStats?.comprehensive)}
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
      
      <div className="exam-card-footer mt-auto">
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