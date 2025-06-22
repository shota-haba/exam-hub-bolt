'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { SessionMode, Question, QuestionResult, ExamSet } from '@/lib/types/index'
import { saveSessionResultAction } from '@/lib/actions/exam'
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
  
  if (results) {
    return (
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">結果</h1>
        </div>
        
        <Card>
          <CardContent className="pt-8">
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{results.correctCount}/{results.totalQuestions}</div>
                <p className="text-sm text-muted-foreground mt-2">正解数</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.round((results.correctCount / results.totalQuestions) * 100)}%</div>
                <p className="text-sm text-muted-foreground mt-2">正答率</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{Math.round(results.timeTaken)}秒</div>
                <p className="text-sm text-muted-foreground mt-2">所要時間</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight mb-6">設問レビュー</h2>
            <div className="space-y-6">
              {results.questions.map((item, index) => (
                <div key={index} className="p-6 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${item.isCorrect ? 'bg-muted' : 'bg-destructive/10'}`}>
                      <div className={`w-4 h-4 rounded-full ${item.isCorrect ? 'bg-foreground' : 'bg-destructive'}`}></div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <p className="font-semibold text-lg">{item.question.text}</p>
                      
                      <div className="space-y-2">
                        {item.question.choices.map((choice) => (
                          <div 
                            key={choice.id}
                            className={`p-3 rounded border ${
                              choice.isCorrect ? 'border-foreground bg-muted' :
                              choice.identifier === item.selectedAnswer && !choice.isCorrect ? 'border-destructive bg-destructive/5' :
                              'border-border'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{choice.identifier}</span>
                              <span>{choice.text}</span>
                              {choice.isCorrect && <span className="text-sm text-muted-foreground">(正解)</span>}
                              {choice.identifier === item.selectedAnswer && !choice.isCorrect && <span className="text-sm text-destructive">(選択)</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {item.question.explanation && (
                        <div className="border-t pt-4">
                          <p className="font-medium mb-2">解説</p>
                          <p className="text-muted-foreground">{item.question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-8">
            <Button asChild>
              <Link href="/dashboard">ダッシュボード</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  if (!currentQuestion) {
    return (
      <div className="container">
        <div className="flex flex-col items-center justify-center py-16">
          <h1 className="text-2xl font-bold mb-4">学習モードに設問がありません</h1>
          <p className="text-muted-foreground mb-6">選択した学習モードに該当する設問が見つかりませんでした</p>
          <Button asChild>
            <Link href="/exams">試験管理に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">{examSet.title}</h1>
          <p className="text-muted-foreground mt-1">
            {currentQuestionIndex + 1} / {questions.length}設問
          </p>
        </div>
        {timeLimit > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold">{timeLeft}秒</div>
            <p className="text-sm text-muted-foreground">残り時間</p>
          </div>
        )}
      </div>
      
      <Progress 
        value={timeLimit > 0 ? ((timeLimit - timeLeft) / timeLimit) * 100 : (currentQuestionIndex / questions.length) * 100} 
        className="h-2 mb-8" 
      />
      
      <Card>
        <CardContent className="pt-8">
          <h2 className="text-xl font-semibold mb-8">{currentQuestion.text}</h2>
          
          <div className="space-y-4">
            {currentQuestion.choices.map((choice) => (
              <div 
                key={choice.id}
                className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                  isAnswered && choice.isCorrect ? 'border-foreground bg-muted' : 
                  isAnswered && selectedAnswer === choice.identifier && !choice.isCorrect ? 'border-destructive bg-destructive/5' : 
                  selectedAnswer === choice.identifier ? 'border-foreground bg-muted' :
                  'hover:bg-muted/50'
                }`}
                onClick={() => !isAnswered && handleAnswer(choice.identifier)}
              >
                <div className="flex items-start w-full">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 mr-4 ${
                    selectedAnswer === choice.identifier ? 'border-foreground bg-foreground text-background' : 'border-muted-foreground'
                  }`}>
                    <span className="text-sm font-medium">{choice.identifier}</span>
                  </div>
                  <div className="flex-1 text-base leading-relaxed">{choice.text}</div>
                </div>
              </div>
            ))}
          </div>
          
          {isAnswered && currentQuestion.explanation && (
            <div className="mt-8 p-6 border rounded-lg bg-muted">
              <h3 className="font-semibold mb-3">解説</h3>
              <p className="text-sm leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-end pt-6">
          {isAnswered && (
            <Button onClick={handleNextQuestion} size="lg">
              {currentQuestionIndex < questions.length - 1 ? '次の設問' : '結果を見る'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}