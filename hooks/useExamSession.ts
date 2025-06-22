import { useState, useEffect, useCallback, useRef } from 'react'
import { SessionMode, Question, QuestionResult, ExamSet } from '@/lib/types'
import { saveSessionResultAction } from '@/lib/actions/exam'

interface UseExamSessionProps {
  examSet: ExamSet
  questions: Question[]
  mode: SessionMode
  timeLimit: number
}

interface UseExamSessionReturn {
  currentQuestionIndex: number
  selectedAnswer: string | null
  isAnswered: boolean
  timeLeft: number
  results: SessionResults | null
  sessionQuestions: QuestionResult[]
  currentQuestion: Question | undefined
  handleAnswer: (answerId: string | null) => void
  handleNextQuestion: () => void
  finishSession: () => Promise<void>
}

type SessionResults = {
  correctCount: number
  totalQuestions: number
  timeTaken: number
  questions: QuestionResult[]
}

/**
 * 試験セッションの状態管理とビジネスロジックを担当するカスタムフック
 * タイマー管理、回答処理、結果計算などを一元化
 */
export function useExamSession({ 
  examSet, 
  questions, 
  mode, 
  timeLimit 
}: UseExamSessionProps): UseExamSessionReturn {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [results, setResults] = useState<SessionResults | null>(null)
  const [sessionStartTime] = useState(new Date())
  const progressRef = useRef<HTMLDivElement>(null)
  
  const [sessionQuestions, setSessionQuestions] = useState<QuestionResult[]>(
    questions.map(q => ({
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
  
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      finishSession()
    }
  }, [currentQuestionIndex, questions.length])
  
  const finishSession = useCallback(async () => {
    const correctCount = sessionQuestions.filter(q => q.isCorrect).length
    const totalTimeSpent = sessionQuestions.reduce((sum, q) => sum + q.timeSpent, 0)
    
    const sessionResults = {
      correctCount,
      totalQuestions: questions.length,
      timeTaken: totalTimeSpent,
      questions: sessionQuestions
    }
    
    setResults(sessionResults)
    
    await saveSessionResultAction({
      examId: examSet.id,
      mode,
      startTime: sessionStartTime,
      endTime: new Date(),
      score: correctCount,
      totalQuestions: questions.length,
      questionsData: sessionQuestions
    })
  }, [sessionQuestions, questions.length, examSet.id, mode, sessionStartTime])

  return {
    currentQuestionIndex,
    selectedAnswer,
    isAnswered,
    timeLeft,
    results,
    sessionQuestions,
    currentQuestion,
    handleAnswer,
    handleNextQuestion,
    finishSession,
    progressRef
  }
}