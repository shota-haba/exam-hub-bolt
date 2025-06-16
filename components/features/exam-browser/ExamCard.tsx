import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExamSet, ExamModeStats } from '@/lib/types'
import { LikeButton } from './LikeButton'

interface ExamCardProps {
  exam: ExamSet
  showLikeButton?: boolean
  modeStats?: ExamModeStats
  onStartSession?: (examId: string) => void
}

export default function ExamCard({ 
  exam, 
  showLikeButton = false, 
  modeStats,
  onStartSession 
}: ExamCardProps) {
  const questionCount = exam.data?.questions?.length || 0

  const handleClick = () => {
    if (onStartSession) {
      onStartSession(exam.id)
    }
  }

  const CardWrapper = onStartSession ? 'button' : 'div'

  return (
    <CardWrapper 
      onClick={handleClick}
      className={onStartSession ? 'w-full text-left' : ''}
    >
      <Card className={`exam-card ${onStartSession ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}`}>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <CardTitle className="text-lg">{exam.title}</CardTitle>
              <CardDescription>
                {new Date(exam.created_at).toLocaleDateString('ja-JP')}
              </CardDescription>
            </div>
            {showLikeButton && (
              <div onClick={(e) => e.stopPropagation()}>
                <LikeButton 
                  examId={exam.id} 
                  initialLiked={exam.isLiked || false}
                  likesCount={exam.likes_count}
                />
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary">
              {questionCount}問
            </Badge>
            {exam.is_shared && (
              <Badge variant="outline">
                公開中
              </Badge>
            )}
          </div>

          {modeStats && (
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>予習: {modeStats.warmup.count}問</div>
              <div>復習: {modeStats.review.count}問</div>
              <div>反復: {modeStats.repetition.count}問</div>
              <div>総合: {modeStats.comprehensive.count}問</div>
            </div>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  )
}