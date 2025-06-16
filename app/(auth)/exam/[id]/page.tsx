import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getQuestionsForSession } from '@/lib/supabase/db'
import { SessionMode } from '@/lib/types'
import ExamSession from './ExamSession'

interface ExamPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    mode?: string
    count?: string
    time?: string
  }>
}

export default async function ExamPage({ params, searchParams }: ExamPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/dashboard')
  }

  const { id: examId } = await params
  const { mode, count, time } = await searchParams
  
  const sessionMode = mode as SessionMode || SessionMode.Warmup
  const questionCount = parseInt(count || '10')
  const timeLimit = parseInt(time || '30')

  // 試験セットを取得
  const { data: examSet, error: examError } = await supabase
    .from('exam_sets')
    .select('*')
    .eq('id', examId)
    .single()

  if (examError || !examSet) {
    notFound()
  }

  // セッション用問題を取得
  const questions = await getQuestionsForSession(examId, user.id, sessionMode, questionCount)

  if (questions.length === 0) {
    return (
      <div className="container py-8 px-4 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-4">問題がありません</h1>
        <p className="text-muted-foreground mb-6 text-center">
          選択した学習モードに該当する問題が見つかりませんでした。
        </p>
        <a 
          href="/dashboard" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          ダッシュボードに戻る
        </a>
      </div>
    )
  }

  return <ExamSession examSet={examSet} questions={questions} />
}