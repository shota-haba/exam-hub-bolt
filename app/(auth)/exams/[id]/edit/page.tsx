import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamEditForm } from '@/components/features/exam-manager/ExamEditForm'

interface ExamEditPageProps {
  params: Promise<{ id: string }>
}

export default async function ExamEditPage({ params }: ExamEditPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/dashboard')
  }

  const { id: examId } = await params

  const { data: examSet, error } = await supabase
    .from('exam_sets')
    .select('*')
    .eq('id', examId)
    .eq('user_id', user.id)
    .single()

  if (error || !examSet) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">試験編集</h2>
      </div>
      
      <ExamEditForm examSet={examSet} />
    </div>
  )
}