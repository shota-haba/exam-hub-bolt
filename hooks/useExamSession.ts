'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { SessionMode, Question, QuestionResult, ExamSet } from '@/lib/types'
import { saveSessionResultAction } from '@/lib/actions/exam'
import { awardSessionPointsAction } from '@/lib/actions/gamification'

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
  progressRef: React.RefObject<HTMLDivElement>
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
 * sessionStorageによる結果永続化でページ再評価に対応
 */
export function useExamSession({ 
  examSet, 
  questions, 
  mode, 
  timeLimit 
}: UseExamSessionProps): UseExamSessionReturn {
  const searchParams = useSearchParams()
  
  // セッション固有のキーを生成（URL パラメータを含む）
  const sessionKey = `examSession-${examSet.id}-${searchParams.toString()}`
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [sessionStartTime] = useState(new Date())
  const progressRef = useRef<HTMLDivElement>(null)

  // 結果の初期化：sessionStorageから復元を試行
  const [results, setResults] = useState<SessionResults | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedResults = sessionStorage.getItem(sessionKey)
        if (savedResults) {
          const parsedResults = JSON.parse(savedResults)
          console.log('セッション結果をsessionStorageから復元:', parsedResults)
          return parsedResults
        }
      } catch (error) {
        console.error('sessionStorageからの結果復元に失敗:', error)
        sessionStorage.removeItem(sessionKey) // 破損したデータを削除
      }
    }
    return null
  })
  
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
    
    // 重要: sessionQuestionsの更新を同期的に処理
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

  const finishSession = useCallback(() => {
    // 最新のsessionQuestionsを使用して結果を計算
    setSessionQuestions(currentSessionQuestions => {
      const correctCount = currentSessionQuestions.filter(q => q.isCorrect).length
      const totalTimeSpent = currentSessionQuestions.reduce((sum, q) => sum + q.timeSpent, 0)
      
      const sessionResults = {
        correctCount,
        totalQuestions: questions.length,
        timeTaken: totalTimeSpent,
        questions: currentSessionQuestions
      }
      
      // 結果をstateとsessionStorageの両方に保存
      setResults(sessionResults)
      
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(sessionKey, JSON.stringify(sessionResults))
          console.log('セッション結果をsessionStorageに保存:', sessionResults)
        } catch (error) {
          console.error('sessionStorageへの保存に失敗:', error)
        }
      }
      
      // セッション結果を非同期で保存
      saveSessionResultAction({
        examId: examSet.id,
        mode,
        startTime: sessionStartTime,
        endTime: new Date(),
        score: correctCount,
        totalQuestions: questions.length,
        questionsData: currentSessionQuestions
      }).catch(error => {
        console.error('セッション結果の保存に失敗:', error)
      })

      // ゲーミフィケーション: ポイント付与
      awardSessionPointsAction(
        examSet.id,
        correctCount,
        questions.length
      ).catch(error => {
        console.error('ポイント付与に失敗:', error)
      })
      
      return currentSessionQuestions
    })
  }, [questions.length, examSet.id, mode, sessionStartTime, sessionKey])
  
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      // 最後の問題の場合、finishSessionを非同期で呼び出し
      // sessionQuestionsの更新が確実に反映されるようにする
      setTimeout(() => {
        finishSession()
      }, 0)
    }
  }, [currentQuestionIndex, questions.length, finishSession])

  // コンポーネントのアンマウント時にsessionStorageをクリーンアップ
  useEffect(() => {
    return () => {
      // 結果が表示されていない場合のみクリーンアップ
      if (!results && typeof window !== 'undefined') {
        sessionStorage.removeItem(sessionKey)
      }
    }
  }, [sessionKey, results])

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
    progressRef
  }
}