'use client'

import { useSearchParams } from 'next/navigation'
import { useRef, useEffect } from 'react'
import { useAuth } from '@/components/shared/AuthProvider'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SessionMode, Question, ExamSet } from '@/lib/types/index'
import { useExamSession } from '@/hooks/useExamSession'
import Link from 'next/link'

interface ExamSessionProps {
  examSet: ExamSet
  questions: Question[]
}

export default function ExamSession({ examSet, questions: initialQuestions }: ExamSessionProps) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  
  // セッション開始時の問題リストをuseRefで保持（再レンダリング対策）
  const initialQuestionsRef = useRef(initialQuestions)
  
  const mode = searchParams.get('mode') as SessionMode || SessionMode.Warmup
  const timeLimit = parseInt(searchParams.get('time') || '30')
  
  const {
    currentQuestionIndex,
    selectedAnswer,
    isAnswered,
    timeLeft,
    results,
    currentQuestion,
    handleAnswer,
    handleNextQuestion,
    progressRef
  } = useExamSession({
    examSet,
    questions: initialQuestionsRef.current, // refの値を使用
    mode,
    timeLimit
  })

  // 結果が表示されている場合の早期リターン（最優先）
  if (results) {
    return (
      <div className="content-container">
        <div className="flex items-center justify-between space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">結果</h2>
        </div>
        
        <Card className="data-card">
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
                <div key={index} className="p-4 border rounded-lg bg-muted/20">
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
  
  // 問題が存在しない場合（初期問題リストが空の場合のみ）
  if (!currentQuestion && initialQuestionsRef.current.length === 0) {
    return (
      <div className="content-container">
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-2xl font-bold mb-4">学習モードに設問がありません</h2>
          <p className="text-muted-foreground mb-6 text-center">
            選択した学習モードに該当する設問が見つかりませんでした。
          </p>
          <Button asChild>
            <Link href="/exams">Session</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="content-container">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">{examSet.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {currentQuestionIndex + 1} / {initialQuestionsRef.current.length}設問
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
        className="w-full bg-secondary rounded-full h-2 overflow-hidden mb-4"
      >
        <div 
          className="h-full bg-primary transition-all duration-75 ease-linear"
          style={{ width: timeLimit > 0 ? 'var(--progress, 0%)' : `${((currentQuestionIndex + 1) / initialQuestionsRef.current.length) * 100}%` }}
        />
      </div>
      
      <Card className="data-card">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-6">{currentQuestion?.text}</h3>
          
          <div className="space-y-3">
            {currentQuestion?.choices.map((choice) => (
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
          
          {isAnswered && currentQuestion?.explanation && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/30">
              <h4 className="font-medium text-sm mb-2">解説</h4>
              <p className="text-sm leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-end pt-4">
          {isAnswered && (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < initialQuestionsRef.current.length - 1 ? '次の設問' : '結果を見る'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}