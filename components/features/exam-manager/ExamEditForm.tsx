'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { ExamSet, Question } from '@/lib/types'
import { updateExamAction } from '@/lib/actions/exam'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Plus, GripVertical, Trash2, Tag } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface ExamEditFormProps {
  examSet: ExamSet
}

export function ExamEditForm({ examSet }: ExamEditFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const [title, setTitle] = useState(examSet.title)
  const [tags, setTags] = useState(examSet.data?.tags || [])
  const [questions, setQuestions] = useState<Question[]>(examSet.data?.questions || [])

  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      text: '',
      explanation: '',
      choices: [
        { id: `choice-${Date.now()}-1`, text: '', identifier: 'ア', isCorrect: false },
        { id: `choice-${Date.now()}-2`, text: '', identifier: 'イ', isCorrect: false },
        { id: `choice-${Date.now()}-3`, text: '', identifier: 'ウ', isCorrect: false },
        { id: `choice-${Date.now()}-4`, text: '', identifier: 'エ', isCorrect: false }
      ]
    }
    setQuestions(prev => [...prev, newQuestion])
  }

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(questions)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setQuestions(items)
  }

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

  const addTag = () => {
    setTags(prev => [...prev, { 項目名: '', 値: '' }])
  }

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index))
  }

  const handleTagChange = (index: number, field: '項目名' | '値', value: string) => {
    setTags(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateExamAction(examSet.id, {
        title,
        data: { ...examSet.data, questions, tags }
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
    <div className="content-container space-y-6">
      {/* 基本情報 */}
      <Card className="data-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">試験タイトル</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="試験のタイトルを入力"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>タグ情報</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus className="h-4 w-4 mr-2" />
                タグ追加
              </Button>
            </div>
            
            <div className="space-y-3">
              {tags.map((tag, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <Input
                    placeholder="項目名"
                    value={tag.項目名}
                    onChange={(e) => handleTagChange(index, '項目名', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="値"
                    value={tag.値}
                    onChange={(e) => handleTagChange(index, '値', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTag(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 設問管理 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">設問一覧</h3>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {questions.map((question, questionIndex) => (
                  <Draggable key={question.id} draggableId={question.id} index={questionIndex}>
                    {(provided, snapshot) => (
                      <Card 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`data-card transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-3">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              設問 {questionIndex + 1}
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(questionIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>設問文</Label>
                            <Textarea
                              value={question.text}
                              onChange={(e) => handleQuestionChange(questionIndex, 'text', e.target.value)}
                              placeholder="設問文を入力してください"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label>選択肢</Label>
                            <div className="space-y-2">
                              {question.choices.map((choice, choiceIndex) => (
                                <div key={choice.id} className="flex items-center gap-2">
                                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center shrink-0">
                                    {choice.identifier}
                                  </Badge>
                                  <Input
                                    value={choice.text}
                                    onChange={(e) => handleChoiceChange(questionIndex, choiceIndex, 'text', e.target.value)}
                                    placeholder={`選択肢${choice.identifier}の内容`}
                                    className="flex-1"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>正解</Label>
                            <RadioGroup
                              value={question.choices.find(c => c.isCorrect)?.identifier || ''}
                              onValueChange={(value) => handleCorrectAnswerChange(questionIndex, value)}
                              className="flex gap-4"
                            >
                              {question.choices.map((choice) => (
                                <div key={choice.id} className="flex items-center gap-2">
                                  <RadioGroupItem value={choice.identifier} id={`${question.id}-${choice.identifier}`} />
                                  <Label htmlFor={`${question.id}-${choice.identifier}`}>
                                    {choice.identifier}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>

                          <div className="space-y-2">
                            <Label>解説</Label>
                            <Textarea
                              value={question.explanation || ''}
                              onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                              placeholder="解説を入力してください（任意）"
                              rows={2}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {/* 設問追加ボタン - 一番下に配置 */}
        <div className="flex justify-center mt-6">
          <Button onClick={addNewQuestion} className="gap-2">
            <Plus className="h-4 w-4" />
            設問追加
          </Button>
        </div>
      </div>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.push('/exams')}>
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={isPending} className="min-w-24">
          {isPending ? <LoadingSpinner size="sm" /> : '保存'}
        </Button>
      </div>
    </div>
  )
}