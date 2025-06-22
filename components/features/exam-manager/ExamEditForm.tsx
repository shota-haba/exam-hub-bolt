'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ExamSet, Question } from '@/lib/types'
import { updateExamAction } from '@/lib/actions/exam'
import { useToast } from '@/hooks/use-toast'

interface ExamEditFormProps {
  examSet: ExamSet
}

export function ExamEditForm({ examSet }: ExamEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const [title, setTitle] = useState(examSet.title)
  const [questions, setQuestions] = useState<Question[]>(examSet.data?.questions || [])

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    setQuestions(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleChoiceChange = (questionIndex: number, choiceIndex: number, field: string, value: any) => {
    setQuestions(prev => {
      const updated = [...prev]
      const choices = [...updated[questionIndex].choices]
      choices[choiceIndex] = { ...choices[choiceIndex], [field]: value }
      updated[questionIndex] = { ...updated[questionIndex], choices }
      return updated
    })
  }

  const handleCorrectAnswerChange = (questionIndex: number, correctIdentifier: string) => {
    setQuestions(prev => {
      const updated = [...prev]
      const choices = updated[questionIndex].choices.map(choice => ({
        ...choice,
        isCorrect: choice.identifier === correctIdentifier
      }))
      updated[questionIndex] = { ...updated[questionIndex], choices }
      return updated
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateExamAction(examSet.id, {
        title,
        data: { ...examSet.data, questions }
      })
      
      if (result.success) {
        toast({
          title: '保存完了',
          description: '試験データが正常に更新されました',
        })
        router.push('/exams')
      } else {
        toast({
          title: '保存失敗',
          description: result.error || '試験データの更新に失敗しました',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">試験タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">設問一覧</h3>
        {questions.map((question, questionIndex) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-base">設問 {questionIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">設問文</Label>
                <Textarea
                  value={question.text}
                  onChange={(e) => handleQuestionChange(questionIndex, 'text', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">選択肢</Label>
                <div className="space-y-3 mt-2">
                  {question.choices.map((choice, choiceIndex) => (
                    <div key={choice.id} className="flex items-center space-x-3">
                      <div className="w-8 text-center text-sm font-medium">
                        {choice.identifier}
                      </div>
                      <Input
                        value={choice.text}
                        onChange={(e) => handleChoiceChange(questionIndex, choiceIndex, 'text', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">正解</Label>
                <RadioGroup
                  value={question.choices.find(c => c.isCorrect)?.identifier || ''}
                  onValueChange={(value) => handleCorrectAnswerChange(questionIndex, value)}
                  className="mt-2"
                >
                  <div className="flex space-x-6">
                    {question.choices.map((choice) => (
                      <div key={choice.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={choice.identifier} id={`${question.id}-${choice.identifier}`} />
                        <Label htmlFor={`${question.id}-${choice.identifier}`} className="text-sm">
                          {choice.identifier}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium">解説</Label>
                <Textarea
                  value={question.explanation || ''}
                  onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={() => router.push('/exams')}>
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}