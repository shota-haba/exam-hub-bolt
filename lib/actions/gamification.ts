'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { 
  processLoginBonus, 
  awardPoints, 
  getUserGamificationStats,
  calculateSessionPoints
} from '@/lib/supabase/gamification'

export async function processLoginBonusAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: '認証が必要です' }
    }

    const result = await processLoginBonus(user.id)
    
    revalidatePath('/dashboard')
    return { success: true, data: result }
  } catch (error) {
    console.error('Login bonus error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'ログインボーナス処理に失敗しました' 
    }
  }
}

export async function awardSessionPointsAction(
  examId: string,
  correctAnswers: number,
  totalQuestions: number
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: '認証が必要です' }
    }

    const isPerfectScore = correctAnswers === totalQuestions
    const result = await calculateSessionPoints(
      examId,
      correctAnswers,
      totalQuestions,
      isPerfectScore,
      user.id
    )
    
    revalidatePath('/dashboard')
    return { success: true, data: result }
  } catch (error) {
    console.error('Session points error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'ポイント付与に失敗しました' 
    }
  }
}

export async function getUserGamificationStatsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: '認証が必要です' }
    }

    const stats = await getUserGamificationStats(user.id)
    
    return { success: true, data: stats }
  } catch (error) {
    console.error('Get gamification stats error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '統計取得に失敗しました' 
    }
  }
}