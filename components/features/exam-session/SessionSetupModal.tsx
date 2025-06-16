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

  const handleStart = () => {
    const params = new URLSearchParams({
      mode: selectedMode,
      count: questionCount[0].toString(),
      time: timePerQuestion[0].toString()
    })
    
    router.push(`/exam/${examId}?${params.toString()}`)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">学習セッション設定</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium text-gray-900">学習モード</Label>
            <RadioGroup 
              value={selectedMode} 
              onValueChange={(value) => {
                setSelectedMode(value as SessionMode)
                setQuestionCount([Math.min(questionCount[0], modeStats[value as SessionMode]?.count || 0)])
              }}
              className="mt-3 space-y-3"
            >
              {Object.entries(modeLabels).map(([mode, label]) => {
                const count = modeStats[mode as SessionMode]?.count || 0
                const isDisabled = count === 0
                
                return (
                  <div key={mode} className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={mode} 
                      id={mode}
                      disabled={isDisabled}
                      className="mt-1"
                    />
                    <Label 
                      htmlFor={mode} 
                      className={`flex-1 cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-gray-900">{label}</div>
                        <div className="text-sm text-gray-500">
                          {count}問
                        </div>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium text-gray-900">
              出題数: {questionCount[0]}問
            </Label>
            <Slider
              value={questionCount}
              onValueChange={setQuestionCount}
              max={Math.max(maxQuestions, 5)}
              min={5}
              step={1}
              className="mt-3"
              disabled={isStartDisabled}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5問</span>
              <span>{maxQuestions}問</span>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium text-gray-900">
              1問あたりの時間: {timePerQuestion[0]}秒
            </Label>
            <Slider
              value={timePerQuestion}
              onValueChange={setTimePerQuestion}
              max={120}
              min={15}
              step={15}
              className="mt-3"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
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
              className="px-6"
            >
              学習開始
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}