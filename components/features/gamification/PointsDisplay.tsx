'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Zap, Target, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <Card className={cn("border-0 bg-gradient-to-br from-background to-muted/20", className)}>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-muted-foreground">レベル</span>
            </div>
            <div className="text-2xl font-bold">{level}</div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {currentExp} / {currentExp + expToNext} EXP
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">今日</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                {dailyPoints}pt
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">累計</span>
              </div>
              <Badge variant="outline" className="font-mono">
                {totalPoints.toLocaleString()}pt
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}