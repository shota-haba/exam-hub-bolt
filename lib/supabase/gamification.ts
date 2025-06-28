import { createClient } from './server'

/**
 * ゲーミフィケーション機能のDB操作
 */

/**
 * 現在のユーザーIDを取得するヘルパー関数
 */
async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('認証が必要です')
  return user.id
}

/**
 * ログインボーナスを処理
 */
export async function processLoginBonus(userId?: string): Promise<any> {
  const supabase = await createClient()
  const targetUserId = userId || await getCurrentUserId()
  
  const { data, error } = await supabase.rpc('process_login_bonus', {
    p_user_id: targetUserId
  })
  
  if (error) throw error
  return data
}

/**
 * ポイントを付与
 */
export async function awardPoints(
  examId: string | null,
  transactionType: string,
  points: number,
  description?: string,
  userId?: string
): Promise<any> {
  const supabase = await createClient()
  const targetUserId = userId || await getCurrentUserId()
  
  const { data, error } = await supabase.rpc('award_points', {
    p_user_id: targetUserId,
    p_exam_id: examId,
    p_transaction_type: transactionType,
    p_points: points,
    p_description: description
  })
  
  if (error) throw error
  return data
}

/**
 * ユーザーのゲーミフィケーション統計を取得
 */
export async function getUserGamificationStats(userId?: string): Promise<any> {
  const supabase = await createClient()
  const targetUserId = userId || await getCurrentUserId()
  
  const { data, error } = await supabase.rpc('get_user_gamification_stats', {
    p_user_id: targetUserId
  })
  
  if (error) throw error
  return data
}

/**
 * セッション完了時のポイント計算
 */
export async function calculateSessionPoints(
  examId: string,
  correctAnswers: number,
  totalQuestions: number,
  isPerfectScore: boolean,
  userId?: string
): Promise<any> {
  const basePoints = 20 // セッション完了基本ポイント
  const answerPoints = correctAnswers * 5 // 正解1問につき5pt
  const perfectBonus = isPerfectScore ? 50 : 0 // パーフェクトボーナス
  
  const totalPoints = basePoints + answerPoints + perfectBonus
  
  let description = `セッション完了 (${correctAnswers}/${totalQuestions}問正解)`
  if (isPerfectScore) {
    description += ' + パーフェクトボーナス'
  }
  
  return await awardPoints(
    examId,
    'session_complete',
    totalPoints,
    description,
    userId
  )
}

/**
 * 試験別レベル情報を取得
 */
export async function getExamLevel(examId: string, userId?: string): Promise<any> {
  const supabase = await createClient()
  const targetUserId = userId || await getCurrentUserId()
  
  const { data, error } = await supabase
    .from('exam_levels')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('exam_id', examId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  
  return data || {
    level: 1,
    current_exp: 0,
    total_points: 0
  }
}

/**
 * ユーザーポイント情報を取得
 */
export async function getUserPoints(userId?: string): Promise<any> {
  const supabase = await createClient()
  const targetUserId = userId || await getCurrentUserId()
  
  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', targetUserId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  
  return data || {
    total_points: 0,
    daily_points: 0
  }
}