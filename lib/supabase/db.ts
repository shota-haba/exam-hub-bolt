import { createClient } from './server'
import { ExamSet, DashboardStats, SharedExamsOptions, UserProgress, SessionResult, SessionMode, Question, ExamModeStats } from '@/lib/types'

/**
 * DB操作サービス層 - 全DBクエリを集約
 */

/**
 * ユーザーの試験一覧を取得
 */
export async function getUserExams(userId: string): Promise<ExamSet[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exam_sets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

/**
 * 共有試験一覧を取得（いいね状態付き）
 */
export async function getSharedExams(
  userId: string, 
  options: SharedExamsOptions = {}
): Promise<ExamSet[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('exam_sets')
    .select(`
      *,
      exam_likes!inner(user_id)
    `)
    .eq('is_shared', true)
    .neq('user_id', userId)
  
  if (options.searchTerm) {
    query = query.ilike('title', `%${options.searchTerm}%`)
  }
  
  if (options.sortBy === 'likes') {
    query = query.order('likes_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  const examsWithLikes = (data || []).map(exam => ({
    ...exam,
    isLiked: exam.exam_likes?.some((like: any) => like.user_id === userId) || false
  }))
  
  return examsWithLikes
}

/**
 * 単一試験セットを取得
 */
export async function getExamSet(examId: string, userId: string): Promise<ExamSet | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exam_sets')
    .select('*')
    .eq('id', examId)
    .eq('user_id', userId)
    .single()
  
  if (error) return null
  return data
}

/**
 * セッション用問題を取得
 */
export async function getQuestionsForSession(
  examId: string, 
  userId: string, 
  mode: SessionMode, 
  count: number
): Promise<Question[]> {
  const supabase = await createClient()
  
  const { data: examSet, error: examError } = await supabase
    .from('exam_sets')
    .select('data')
    .eq('id', examId)
    .single()
  
  if (examError || !examSet?.data?.questions) return []
  
  const allQuestions = examSet.data.questions as Question[]
  
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('question_id, last_result')
    .eq('user_id', userId)
    .eq('exam_set_id', examId)
  
  const progressMap = new Map(
    (progressData || []).map(p => [p.question_id, p.last_result])
  )
  
  let targetQuestions: Question[] = []
  
  switch (mode) {
    case SessionMode.Warmup:
      targetQuestions = allQuestions.filter(q => !progressMap.has(q.id))
      break
    case SessionMode.Review:
      targetQuestions = allQuestions.filter(q => progressMap.get(q.id) === false)
      break
    case SessionMode.Repetition:
      targetQuestions = allQuestions.filter(q => progressMap.get(q.id) === true)
      break
    case SessionMode.Comprehensive:
      targetQuestions = allQuestions
      break
  }
  
  if (targetQuestions.length === 0) return []
  
  if (targetQuestions.length <= count) {
    return targetQuestions.sort(() => Math.random() - 0.5)
  }
  
  return targetQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
}

/**
 * 試験のモード別統計を取得
 */
export async function getExamStatsByMode(examId: string, userId: string): Promise<ExamModeStats> {
  const supabase = await createClient()
  
  const { data: examSet } = await supabase
    .from('exam_sets')
    .select('data')
    .eq('id', examId)
    .single()
  
  if (!examSet?.data?.questions) {
    return {
      warmup: { count: 0, attempts: 0 },
      review: { count: 0, attempts: 0 },
      repetition: { count: 0, attempts: 0 },
      comprehensive: { count: 0, attempts: 0 }
    }
  }
  
  const allQuestions = examSet.data.questions as Question[]
  
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('question_id, last_result')
    .eq('user_id', userId)
    .eq('exam_set_id', examId)
  
  const progressMap = new Map(
    (progressData || []).map(p => [p.question_id, p.last_result])
  )
  
  const { data: sessionData } = await supabase
    .from('session_results')
    .select('session_mode')
    .eq('user_id', userId)
    .eq('exam_set_id', examId)
  
  const sessionCounts = (sessionData || []).reduce((acc, session) => {
    acc[session.session_mode] = (acc[session.session_mode] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const warmupCount = allQuestions.filter(q => !progressMap.has(q.id)).length
  const reviewCount = allQuestions.filter(q => progressMap.get(q.id) === false).length
  const repetitionCount = allQuestions.filter(q => progressMap.get(q.id) === true).length
  const comprehensiveCount = allQuestions.length
  
  return {
    warmup: { count: warmupCount, attempts: sessionCounts.warmup || 0 },
    review: { count: reviewCount, attempts: sessionCounts.review || 0 },
    repetition: { count: repetitionCount, attempts: sessionCounts.repetition || 0 },
    comprehensive: { count: comprehensiveCount, attempts: sessionCounts.comprehensive || 0 }
  }
}

/**
 * 試験の進捗を取得
 */
export async function getExamProgress(examId: string, userId: string): Promise<number> {
  const supabase = await createClient()
  
  const { data: examSet } = await supabase
    .from('exam_sets')
    .select('data')
    .eq('id', examId)
    .single()
  
  if (!examSet?.data?.questions) return 0
  
  const totalQuestions = examSet.data.questions.length
  
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('question_id')
    .eq('user_id', userId)
    .eq('exam_set_id', examId)
  
  const answeredQuestions = progressData?.length || 0
  
  return Math.round((answeredQuestions / totalQuestions) * 100)
}

/**
 * ダッシュボード統計を取得
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = await createClient()
  
  const { data: exams } = await supabase
    .from('exam_sets')
    .select('data')
    .eq('user_id', userId)
  
  const totalExams = exams?.length || 0
  const totalQuestions = exams?.reduce((sum, exam) => 
    sum + (exam.data?.questions?.length || 0), 0) || 0
  
  const { data: sessions } = await supabase
    .from('session_results')
    .select('start_time, end_time, score, total_questions')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  
  const averageAnswerTime = sessions?.length > 0 
    ? sessions.reduce((total, session) => {
        const start = new Date(session.start_time).getTime()
        const end = new Date(session.end_time).getTime()
        const sessionTime = (end - start) / 1000
        return total + (sessionTime / session.total_questions)
      }, 0) / sessions.length
    : 0
  
  const recentSessions = sessions?.length || 0
  
  const averageProgress = sessions?.length > 0 
    ? sessions.reduce((sum, s) => sum + (s.score / s.total_questions * 100), 0) / sessions.length
    : 0
  
  return {
    totalExams,
    totalQuestions,
    averageProgress: Math.round(averageProgress),
    averageAnswerTime: Math.round(averageAnswerTime),
    recentSessions,
    weeklyStreak: 7
  }
}

/**
 * 試験をインポート
 */
export async function importExamSet(
  userId: string, 
  title: string, 
  examData: any
): Promise<ExamSet> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exam_sets')
    .insert({
      title,
      user_id: userId,
      data: examData,
      is_shared: false,
      likes_count: 0
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 試験の共有状態を更新
 */
export async function updateExamShared(
  examId: string, 
  userId: string, 
  isShared: boolean
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('exam_sets')
    .update({ is_shared: isShared })
    .eq('id', examId)
    .eq('user_id', userId)
  
  if (error) throw error
}

/**
 * 試験のいいね状態を切り替え
 */
export async function toggleExamLike(
  examId: string, 
  userId: string, 
  hasLiked: boolean
): Promise<void> {
  const supabase = await createClient()
  
  if (hasLiked) {
    const { error: deleteError } = await supabase
      .from('exam_likes')
      .delete()
      .eq('exam_id', examId)
      .eq('user_id', userId)
    
    if (deleteError) throw deleteError
    
    const { error: updateError } = await supabase
      .rpc('decrement_likes_count', { exam_id: examId })
    
    if (updateError) throw updateError
  } else {
    const { error: insertError } = await supabase
      .from('exam_likes')
      .insert({ exam_id: examId, user_id: userId })
    
    if (insertError) throw insertError
    
    const { error: updateError } = await supabase
      .rpc('increment_likes_count', { exam_id: examId })
    
    if (updateError) throw updateError
  }
}

/**
 * セッション結果を保存
 */
export async function saveSessionResult(
  userId: string,
  examId: string,
  sessionMode: string,
  startTime: Date,
  endTime: Date,
  score: number,
  totalQuestions: number,
  questionsData: any
): Promise<SessionResult> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('session_results')
    .insert({
      user_id: userId,
      exam_set_id: examId,
      session_mode: sessionMode,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      score,
      total_questions: totalQuestions,
      questions_data: questionsData
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * 試験を削除
 */
export async function deleteExamSet(examId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('exam_sets')
    .delete()
    .eq('id', examId)
    .eq('user_id', userId)
  
  if (error) throw error
}