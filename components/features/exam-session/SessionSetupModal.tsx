'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { SessionMode, ExamModeStats } from '@/lib/types'

interface SessionSetupModalProps {
  isOpen: boolean
  onClose: () => void
  examId: string
  modeStats: ExamModeStats
}

const modeLabels = {
  [SessionMode.Warmup]: '予習',
  [SessionMode.Review]: '復習',
  [SessionMode.Repetition]: '反復',
  [SessionMode.Comprehensive]: '総合'
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>セッション設定</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label className="text-sm font-medium">モード</Label>
            <RadioGroup 
              value={selectedMode} 
              onValueChange={(value) => {
                setSelectedMode(value as SessionMode)
                const newMaxQuestions = modeStats[value as SessionMode]?.count || 0
                setQuestionCount([Math.min(questionCount[0], newMaxQuestions)])
              }}
              className="mt-3 space-y-3"
            >
              {Object.entries(modeLabels).map(([mode, label]) => {
                const count = modeStats[mode as SessionMode]?.count || 0
                const isDisabled = count === 0
                
                return (
                  <div key={mode} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={mode} 
                      id={mode}
                      disabled={isDisabled}
                    />
                    <Label 
                      htmlFor={mode} 
                      className={`flex-1 cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{label}</span>
                        <span className="text-sm text-muted-foreground">
                          {count}設問
                        </span>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-sm font-medium">
              設問数: {adjustedQuestionCount}
            </Label>
            <Slider
              value={[adjustedQuestionCount]}
              onValueChange={(value) => setQuestionCount([Math.min(value[0], maxQuestions)])}
              max={maxSliderQuestions}
              min={minQuestions}
              step={1}
              className="mt-3"
              disabled={isStartDisabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{minQuestions}</span>
              <span>{maxQuestions}</span>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">
              制限時間: {timePerQuestion[0]}秒/設問
            </Label>
            <Slider
              value={timePerQuestion}
              onValueChange={setTimePerQuestion}
              max={120}
              min={15}
              step={15}
              className="mt-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>15秒</span>
              <span>120秒</span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button 
              onClick={handleStart}
              disabled={isStartDisabled}
            >
              開始
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}