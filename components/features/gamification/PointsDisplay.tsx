'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

interface PointsDisplayProps {
  totalPoints: number
  dailyPoints: number
  level: number
  currentExp: number
  expToNext: number
  className?: string
}

export function PointsDisplay({ 
  totalPoints, 
  dailyPoints, 
  level, 
  currentExp, 
  expToNext,
  className 
}: PointsDisplayProps) {
  const progressPercentage = (currentExp / (currentExp + expToNext)) * 100

  return (
    <Card className={cn("border shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-primary text-primary-foreground">
              <AvatarFallback className="text-xl font-bold">{level}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="text-sm font-medium">レベル {level}</div>
              <Progress value={progressPercentage} className="h-2 w-32" />
              <div className="text-xs text-muted-foreground">
                {currentExp} / {currentExp + expToNext} EXP
              </div>
            </div>
          </div>
          
          <div className="space-y-3 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">日計</span>
              <Badge variant="secondary" className="font-mono">
                {dailyPoints}pt
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">累計</span>
              <Badge variant="secondary" className="font-mono">
                {totalPoints.toLocaleString()}pt
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-center bg-muted/50 p-3 rounded-lg w-full">
              <div className="text-sm font-medium mb-1">次のレベルまで</div>
              <div className="text-2xl font-bold">{expToNext}pt</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}