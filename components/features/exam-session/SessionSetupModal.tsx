'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { SessionMode, ExamModeStats } from '@/lib/types'
import { Clock, BookOpen, Target, Zap, Trophy } from 'lucide-react'

interface SessionSetupModalProps {
  isOpen: boolean
  onClose: () => void
  examId: string
  modeStats: ExamModeStats
}

const modeConfig = {
  [SessionMode.Warmup]: {
    label: '予習',
    icon: BookOpen,
    description: '未学習の問題に集中',
    color: 'bg-blue-100 text-blue-700'
  },
  [SessionMode.Review]: {
    label: '復習',
    icon: Target,
    description: '間違えた問題を重点復習',
    color: 'bg-orange-100 text-orange-700'
  },
  [SessionMode.Repetition]: {
    label: '反復',
    icon: Zap,
    description: '正解した問題の知識定着',
    color: 'bg-green-100 text-green-700'
  },
  [SessionMode.Comprehensive]: {
    label: '総合',
    icon: Trophy,
    description: '全問題での実力測定',
    color: 'bg-purple-100 text-purple-700'
  }
}

export function SessionSetupModal({ isOpen, onClose, examId, modeStats }: SessionSetupModalProps) {
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<SessionMode>(SessionMode.Warmup)
  const [questionCount, setQuestionCount] = useState([10])
  const [timePerQuestion, setTimePerQuestion] = useState([30])

  const maxQuestions = modeStats[selectedMode]?.count || 0
  const isStartDisabled = maxQuestions === 0

  const minQuestions = Math.min(5, maxQuestions)
  const maxSliderQuestions = Math.max(maxQuestions, 5)
  const adjustedQuestionCount = Math.min(questionCount[0], maxQuestions)

  const handleStart = () => {
    const params = new URLSearchParams({
      mode: selectedMode,
      count: adjustedQuestionCount.toString(),
      time: timePerQuestion[0].toString()
    })
    
    router.push(`/exam/${examId}?${params.toString()}`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            セッション設定
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* モード選択 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">学習モード</Label>
            <RadioGroup 
              value={selectedMode} 
              onValueChange={(value) => {
                setSelectedMode(value as SessionMode)
                const newMaxQuestions = modeStats[value as SessionMode]?.count || 0
                setQuestionCount([Math.min(questionCount[0], newMaxQuestions)])
              }}
              className="space-y-3"
            >
              {Object.entries(modeConfig).map(([mode, config]) => {
                const count = modeStats[mode as SessionMode]?.count || 0
                const isDisabled = count === 0
                const Icon = config.icon
                
                return (
                  <div key={mode} className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={mode} 
                      id={mode}
                      disabled={isDisabled}
                    />
                    <Label 
                      htmlFor={mode} 
                      className={`flex-1 cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{config.label}</div>
                            <div className="text-sm text-muted-foreground">{config.description}</div>
                          </div>
                        </div>
                        <Badge variant={count > 0 ? "secondary" : "outline"} className="ml-2">
                          {count}設問
                        </Badge>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* 設問数設定 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              設問数: {adjustedQuestionCount}問
            </Label>
            <Slider
              value={[adjustedQuestionCount]}
              onValueChange={(value) => setQuestionCount([Math.min(value[0], maxQuestions)])}
              max={maxSliderQuestions}
              min={minQuestions}
              step={1}
              className="py-4"
              disabled={isStartDisabled}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{minQuestions}問</span>
              <span>{maxQuestions}問</span>
            </div>
          </div>

          {/* 制限時間設定 */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              制限時間: {timePerQuestion[0]}秒/設問
            </Label>
            <Slider
              value={timePerQuestion}
              onValueChange={setTimePerQuestion}
              max={120}
              min={15}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>15秒</span>
              <span>120秒</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button 
              onClick={handleStart}
              disabled={isStartDisabled}
              className="min-w-24"
            >
              開始
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}