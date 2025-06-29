import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExamEditForm } from '@/components/features/exam-manager/ExamEditForm'
import { AuthGuard } from '@/components/shared/AuthGuard'

interface ExamEditPageProps {
  params: Promise<{ id: string }>
}

export default async function ExamEditPage({ params }: ExamEditPageProps) {
  return (
    <AuthGuard>
      <ExamEditContent params={params} />
    </AuthGuard>
  )
}

async function ExamEditContent({ params }: ExamEditPageProps) {
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

  return <ExamEditForm examSet={examSet} />
}