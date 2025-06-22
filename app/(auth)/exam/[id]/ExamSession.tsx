'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const progressRef = useRef<HTMLDivElement>(null)
  
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
  
  // プログレスバーのアニメーション
  useEffect(() => {
    if (!currentQuestion || isAnswered || results || timeLimit === 0) return
    
    let animationFrame: number
    const startTime = Date.now()
    const duration = timeLimit * 1000
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const remaining = Math.max(timeLimit - Math.floor(elapsed / 1000), 0)
      
      setTimeLeft(remaining)
      
      if (progressRef.current) {
        progressRef.current.style.setProperty('--progress', `${progress * 100}%`)
      }
      
      if (progress < 1 && !isAnswered) {
        animationFrame = requestAnimationFrame(animate)
      } else if (remaining === 0) {
        handleAnswer(null)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
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
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">結果</h2>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-8 mb-8 text-center">
              <div>
                <div className="text-2xl font-bold">{results.correctCount}/{results.totalQuestions}</div>
                <p className="text-sm text-muted-foreground mt-1">正解数</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round((results.correctCount / results.totalQuestions) * 100)}%</div>
                <p className="text-sm text-muted-foreground mt-1">正答率</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(results.timeTaken)}秒</div>
                <p className="text-sm text-muted-foreground mt-1">所要時間</p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">設問レビュー</h3>
            <div className="space-y-4">
              {results.questions.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${item.isCorrect ? 'bg-muted' : 'bg-destructive/10'}`}>
                      <div className={`w-3 h-3 rounded-full ${item.isCorrect ? 'bg-foreground' : 'bg-destructive'}`}></div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="font-medium">{item.question.text}</p>
                      
                      <div className="space-y-2">
                        {item.question.choices.map((choice) => (
                          <div 
                            key={choice.id}
                            className={`p-3 rounded border text-sm ${
                              choice.isCorrect ? 'border-foreground bg-muted' :
                              choice.identifier === item.selectedAnswer && !choice.isCorrect ? 'border-destructive bg-destructive/5' :
                              'border-border'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">{choice.identifier}</span>
                              <span>{choice.text}</span>
                              {choice.isCorrect && <span className="text-xs text-muted-foreground">(正解)</span>}
                              {choice.identifier === item.selectedAnswer && !choice.isCorrect && <span className="text-xs text-destructive">(選択)</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {item.question.explanation && (
                        <div className="border-t pt-3">
                          <p className="font-medium text-sm mb-1">解説</p>
                          <p className="text-sm text-muted-foreground">{item.question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-6">
            <Button asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  if (!currentQuestion) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-2xl font-bold mb-4">学習モードに設問がありません</h2>
          <p className="text-muted-foreground mb-6">選択した学習モードに該当する設問が見つかりませんでした</p>
          <Button asChild>
            <Link href="/exams">試験管理に戻る</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{examSet.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentQuestionIndex + 1} / {questions.length}設問
          </p>
        </div>
        {timeLimit > 0 && (
          <div className="text-right">
            <div className="text-xl font-bold">{timeLeft}秒</div>
            <p className="text-xs text-muted-foreground">残り時間</p>
          </div>
        )}
      </div>
      
      <div 
        ref={progressRef}
        className="w-full bg-secondary rounded-full h-2 overflow-hidden"
      >
        <div 
          className="h-full bg-primary transition-all duration-75 ease-linear"
          style={{ width: timeLimit > 0 ? 'var(--progress, 0%)' : `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-6">{currentQuestion.text}</h3>
          
          <div className="space-y-3">
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
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border mr-3 text-xs font-medium ${
                    selectedAnswer === choice.identifier ? 'border-foreground bg-foreground text-background' : 'border-muted-foreground'
                  }`}>
                    {choice.identifier}
                  </div>
                  <div className="flex-1 text-sm leading-relaxed">{choice.text}</div>
                </div>
              </div>
            ))}
          </div>
          
          {isAnswered && currentQuestion.explanation && (
            <div className="mt-6 p-4 border rounded-lg bg-muted">
              <h4 className="font-medium text-sm mb-2">解説</h4>
              <p className="text-sm leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-end pt-4">
          {isAnswered && (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? '次の設問' : '結果を見る'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}