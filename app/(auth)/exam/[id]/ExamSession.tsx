'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { SessionMode, Question, QuestionResult, ExamSet } from '@/lib/types/index'
import { saveSessionResultAction } from '@/actions/exam'
import Link from 'next/link'

type SessionResults = {
  correctCount: number
  totalQuestions: number
  timeTaken: number
  questions: QuestionResult[]
}

interface ExamSessionProps {
  examSet: ExamSet
  questions: Question[]
}

export default function ExamSession({ examSet, questions: initialQuestions }: ExamSessionProps) {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const mode = searchParams.get('mode') as SessionMode || SessionMode.Warmup
  const count = parseInt(searchParams.get('count') || '10')
  const timeLimit = parseInt(searchParams.get('time') || '30')
  
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [results, setResults] = useState<SessionResults | null>(null)
  const [sessionStartTime] = useState(new Date())
  
  const [sessionQuestions, setSessionQuestions] = useState<QuestionResult[]>(
    initialQuestions.map(q => ({
      question: q,
      selectedAnswer: null,
      isCorrect: false,
      timeSpent: 0
    }))
  )

  const currentQuestion = questions[currentQuestionIndex]
  
  useEffect(() => {
    if (!currentQuestion || isAnswered || results || timeLimit === 0) return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAnswer(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [currentQuestion, isAnswered, results, timeLimit])
  
  useEffect(() => {
    if (currentQuestion && !isAnswered) {
      setTimeLeft(timeLimit)
    }
  }, [currentQuestionIndex, isAnswered, currentQuestion, timeLimit])
  
  const handleAnswer = useCallback((answerId: string | null) => {
    if (isAnswered || !currentQuestion) return
    
    const timeSpent = timeLimit > 0 ? timeLimit - timeLeft : 0
    const isCorrect = currentQuestion.choices.find(c => c.identifier === answerId)?.isCorrect || false
    
    setSelectedAnswer(answerId)
    setIsAnswered(true)
    
    setSessionQuestions(prev => {
      const updated = [...prev]
      updated[currentQuestionIndex] = {
        ...updated[currentQuestionIndex],
        selectedAnswer: answerId,
        isCorrect,
        timeSpent
      }
      return updated
    })
  }, [isAnswered, currentQuestion, timeLimit, timeLeft, currentQuestionIndex])
  
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      finishSession()
    }
  }
  
  const finishSession = async () => {
    const correctCount = sessionQuestions.filter(q => q.isCorrect).length
    const totalTimeSpent = sessionQuestions.reduce((sum, q) => sum + q.timeSpent, 0)
    
    const sessionResults = {
      correctCount,
      totalQuestions: questions.length,
      timeTaken: totalTimeSpent,
      questions: sessionQuestions
    }
    
    setResults(sessionResults)
    
    if (user) {
      await saveSessionResultAction({
        examId: examSet.id,
        mode,
        startTime: sessionStartTime,
        endTime: new Date(),
        score: correctCount,
        totalQuestions: questions.length,
        questionsData: sessionQuestions
      })
    }
  }
  
  const restartExam = () => {
    router.refresh()
  }
  
  if (results) {
    return (
      <main className="container py-8 px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">結果</h1>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">正解数</p>
                <p className="text-2xl font-bold">{results.correctCount}/{results.totalQuestions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">正答率</p>
                <p className="text-2xl font-bold">{Math.round((results.correctCount / results.totalQuestions) * 100)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">所要時間</p>
                <p className="text-2xl font-bold">{Math.round(results.timeTaken)}秒</p>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-4">設問レビュー</h2>
            <div className="space-y-4">
              {results.questions.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${item.isCorrect ? 'bg-muted' : 'bg-destructive/10'}`}>
                      <div className={`w-3 h-3 rounded-full ${item.isCorrect ? 'bg-foreground' : 'bg-destructive'}`}></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.question.text}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.selectedAnswer ? `回答: ${item.question.choices.find(c => c.identifier === item.selectedAnswer)?.text || '不明'}` : '未回答'}
                      </p>
                      {!item.isCorrect && (
                        <p className="text-sm mt-1">
                          正解: {item.question.choices.find(c => c.isCorrect)?.text || '不明'}
                        </p>
                      )}
                      {item.question.explanation && (
                        <p className="text-sm border-t mt-2 pt-2 text-muted-foreground">
                          <span className="font-medium">解説: </span>
                          {item.question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4 pt-2 pb-6">
            <Button onClick={restartExam} variant="outline">
              再学習
            </Button>
            <Button asChild>
              <Link href="/dashboard">ダッシュボード</Link>
            </Button>
          </CardFooter>
        </Card>
      </main>
    )
  }
  
  if (!currentQuestion) {
    return (
      <div className="container py-8 px-4 flex flex-col items-center">
        <p className="mb-4">設問が見つかりませんでした</p>
        <Button asChild>
          <Link href="/exams">試験一覧に戻る</Link>
        </Button>
      </div>
    )
  }
  
  return (
    <main className="container py-8 px-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">{examSet.title}</h2>
          <p className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} / {questions.length}設問
          </p>
        </div>
        {timeLimit > 0 && (
          <div className="flex items-center">
            <span className="font-bold">{timeLeft}秒</span>
          </div>
        )}
      </div>
      
      <Progress 
        value={(currentQuestionIndex / questions.length) * 100} 
        className="h-2 mb-6" 
      />
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold mb-6">{currentQuestion.text}</h2>
          
          <RadioGroup 
            value={selectedAnswer || ''} 
            onValueChange={isAnswered ? undefined : handleAnswer}
            className="space-y-3"
          >
            {currentQuestion.choices.map((choice) => (
              <div 
                key={choice.id}
                className={`relative p-4 border rounded-lg ${
                  isAnswered && choice.isCorrect ? 'border-foreground bg-muted' : 
                  isAnswered && selectedAnswer === choice.identifier && !choice.isCorrect ? 'border-destructive bg-destructive/5' : 
                  'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem
                  value={choice.identifier}
                  id={choice.id}
                  disabled={isAnswered}
                  className="absolute left-4 top-4 peer sr-only"
                />
                <Label 
                  htmlFor={choice.id} 
                  className="flex items-start cursor-pointer"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary text-primary mr-3">
                    <span className="text-sm">{choice.identifier}</span>
                  </div>
                  <div>{choice.text}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          {isAnswered && currentQuestion.explanation && (
            <div className="mt-6 p-4 border rounded-lg bg-muted">
              <div className="flex">
                <div>
                  <h3 className="font-medium mb-1">解説</h3>
                  <p className="text-sm">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-end pt-2 pb-6">
          {isAnswered ? (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? '次の設問' : '結果を見る'}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleAnswer(null)}>
              スキップ
            </Button>
          )}
        </CardFooter>
      </Card>
    </main>
  )
}