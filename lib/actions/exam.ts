'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { 
  importExamSet, 
  updateExamShared, 
  toggleExamLike, 
  saveSessionResult,
  deleteExamSet,
  importSharedExam
} from '@/lib/supabase/db'
import { examSetSchema, transformImportedExam } from '@/lib/schemas/exam'
import { SessionSaveData } from '@/lib/types'

export async function importExamAction(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: '認証が必要です' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'ファイルが選択されていません' }
    }

    const text = await file.text()
    const jsonData = JSON.parse(text)
    
    const validatedData = examSetSchema.parse(jsonData)
    const transformedData = transformImportedExam(validatedData)
    
    await importExamSet(user.id, transformedData.title, transformedData)
    
    revalidatePath('/exams')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Import error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'インポートに失敗しました' 
    }
  }
}

export async function importSharedExamAction(examId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/dashboard')
    }

    await importSharedExam(user.id, examId)
    
    revalidatePath('/exams')
    revalidatePath('/browse')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Import shared exam error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'インポートに失敗しました' 
    }
  }
}

export async function updateExamSharedAction(examId: string, isShared: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: '認証が必要です' }
    }

    await updateExamShared(examId, user.id, isShared)
    
    revalidatePath('/exams')
    revalidatePath('/browse')
    return { success: true }
  } catch (error) {
    console.error('Update shared error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '更新に失敗しました' 
    }
  }
}

export async function toggleExamLikeAction(examId: string, hasLiked: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: '認証が必要です' }
    }

    await toggleExamLike(examId, user.id, hasLiked)
    
    revalidatePath('/browse')
    return { success: true }
  } catch (error) {
    console.error('Toggle like error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'いいねの更新に失敗しました' 
    }
  }
}

export async function saveSessionResultAction(sessionData: SessionSaveData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('認証が必要です')
    }

    await saveSessionResult(
      user.id,
      sessionData.examId,
      sessionData.mode,
      sessionData.startTime,
      sessionData.endTime,
      sessionData.score,
      sessionData.totalQuestions,
      sessionData.questionsData
    )

    // ユーザー進捗を更新
    for (const questionResult of sessionData.questionsData) {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          question_id: questionResult.question.id,
          exam_set_id: sessionData.examId,
          last_result: questionResult.isCorrect,
          attempt_count: 1,
          last_attempted: new Date().toISOString()
        }, {
          onConflict: 'user_id,question_id'
        })

      if (error) {
        console.error('Progress update error:', error)
      }
    }
    
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Save session error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'セッション保存に失敗しました' 
    }
  }
}

export async function deleteExamAction(examId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      redirect('/dashboard')
    }

    await deleteExamSet(examId, user.id)
    
    revalidatePath('/exams')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete exam error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '削除に失敗しました' 
    }
  }
}