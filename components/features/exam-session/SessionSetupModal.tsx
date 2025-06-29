'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { SessionMode, ExamModeStats } from '@/lib/types'
import { Clock } from 'lucide-react'

interface SessionSetupModalProps {
  isOpen: boolean
  onClose: () => void
  examId: string
  modeStats: ExamModeStats
}

const modeConfig = {
  [SessionMode.Warmup]: {
    label: '予習',
  },
  [SessionMode.Review]: {
    label: '復習',
  },
  [SessionMode.Repetition]: {
    label: '反復',
  },
  [SessionMode.Comprehensive]: {
    label: '総合',
  }
}

export function SessionSetupModal({ isOpen, onClose, examId, modeStats }: SessionSetupModalProps) {
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<SessionMode>(SessionMode.Warmup)
  const [questionCount, setQuestionCount] = useState([10])
  const [timePerQuestion, setTimePerQuestion] = useState([30])

  const maxQuestions = modeStats[selectedMode]?.count || 0
  const isStartDisabled = maxQuestions === 0

  // 選択モードが変わったら、設問数スライダーの値を調整
  useEffect(() => {
    const newMaxQuestions = modeStats[selectedMode]?.count || 0
    setQuestionCount([Math.min(questionCount[0], Math.max(1, newMaxQuestions))])
  }, [selectedMode, modeStats])

  const adjustedQuestionCount = Math.min(questionCount[0], maxQuestions || 1)

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
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            セッション設定
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* モード選択 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">モード</Label>
            <RadioGroup 
              value={selectedMode} 
              onValueChange={(value) => setSelectedMode(value as SessionMode)}
              className="grid grid-cols-2 gap-2"
            >
              {Object.entries(modeConfig).map(([mode, config]) => {
                const count = modeStats[mode as SessionMode]?.count || 0
                const isDisabled = count === 0
                
                return (
                  <div key={mode} className="relative">
                    <RadioGroupItem 
                      value={mode} 
                      id={mode}
                      disabled={isDisabled}
                      className="peer sr-only"
                    />
                    <Label 
                      htmlFor={mode} 
                      className={`flex flex-col p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer peer-disabled:opacity-50 peer-disabled:cursor-not-allowed peer-data-[state=checked]:border-foreground peer-data-[state=checked]:bg-muted/50`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{config.label}</span>
                        <Badge variant={count > 0 ? "secondary" : "outline"} className="ml-2">
                          {count}
                        </Badge>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* 設問数設定 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              設問数: {adjustedQuestionCount}問
            </Label>
            <Slider
              value={[adjustedQuestionCount]}
              onValueChange={(value) => setQuestionCount([Math.min(value[0], maxQuestions || 1)])}
              max={maxQuestions || 120}
              min={1}
              step={1}
              disabled={isStartDisabled}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1問</span>
              <span>{maxQuestions || 120}問</span>
            </div>
          </div>

          {/* 制限時間設定 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              制限時間: {timePerQuestion[0]}秒/設問
            </Label>
            <Slider
              value={timePerQuestion}
              onValueChange={setTimePerQuestion}
              max={120}
              min={1}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1秒</span>
              <span>120秒</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end gap-3 pt-3 border-t">
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