'use client'

import { useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { PointsEarned } from '@/lib/types/gamification'
import { Zap, Trophy, Target, Flame } from 'lucide-react'

interface PointsToastProps {
  pointsEarned: PointsEarned[]
  onClear: () => void
}

export function PointsToast({ pointsEarned, onClear }: PointsToastProps) {
  const { toast } = useToast()

  useEffect(() => {
    if (pointsEarned.length === 0) return

    const totalPoints = pointsEarned.reduce((sum, p) => sum + p.points, 0)
    
    const getIcon = (type: PointsEarned['type']) => {
      switch (type) {
        case 'login': return <Flame className="h-4 w-4" />
        case 'session_complete': return <Target className="h-4 w-4" />
        case 'perfect_score': return <Trophy className="h-4 w-4" />
        case 'streak_bonus': return <Zap className="h-4 w-4" />
        default: return <Zap className="h-4 w-4" />
      }
    }

    toast({
      title: (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span>+{totalPoints}pt 獲得！</span>
        </div>
      ),
      description: (
        <div className="space-y-1 mt-2">
          {pointsEarned.map((earned, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {getIcon(earned.type)}
              <span>{earned.description}</span>
              <span className="ml-auto font-mono">+{earned.points}pt</span>
            </div>
          ))}
        </div>
      ),
      duration: 4000,
    })

    onClear()
  }, [pointsEarned, toast, onClear])

  return null
}