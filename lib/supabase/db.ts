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
      exam_likes!left(user_id)
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
    .or(`user_id.eq.${userId},is_shared.eq.true`)
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
 * アナリティクスデータを取得（ダッシュボード用）
 */
export async function getAnalyticsData(userId: string) {
  const supabase = await createClient()
  
  const { data: exams } = await supabase
    .from('exam_sets')
    .select('id, title, data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (!exams) return []
  
  const analyticsData = []
  
  for (const exam of exams) {
    const allQuestions = exam.data?.questions || []
    
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('question_id, last_result')
      .eq('user_id', userId)
      .eq('exam_set_id', exam.id)
    
    const progressMap = new Map(
      (progressData || []).map(p => [p.question_id, p.last_result])
    )
    
    const { data: sessionData } = await supabase
      .from('session_results')
      .select('session_mode, created_at')
      .eq('user_id', userId)
      .eq('exam_set_id', exam.id)
    
    const today = new Date().toDateString()
    
    const todaySessions = (sessionData || []).filter(session => 
      new Date(session.created_at).toDateString() === today
    )
    
    const totalSessions = sessionData?.length || 0
    
    const todaySessionCounts = todaySessions.reduce((acc, session) => {
      acc[session.session_mode] = (acc[session.session_mode] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalSessionCounts = (sessionData || []).reduce((acc, session) => {
      acc[session.session_mode] = (acc[session.session_mode] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const warmupCount = allQuestions.filter(q => !progressMap.has(q.id)).length
    const reviewCount = allQuestions.filter(q => progressMap.get(q.id) === false).length
    const repetitionCount = allQuestions.filter(q => progressMap.get(q.id) === true).length
    
    analyticsData.push({
      examId: exam.id,
      examTitle: exam.title,
      warmupCount,
      reviewCount,
      repetitionCount,
      dailySessions: todaySessions.length,
      totalSessions,
      modeStats: {
        warmup: { 
          count: warmupCount, 
          attempts: totalSessionCounts.warmup || 0,
          dailyAttempts: todaySessionCounts.warmup || 0
        },
        review: { 
          count: reviewCount, 
          attempts: totalSessionCounts.review || 0,
          dailyAttempts: todaySessionCounts.review || 0
        },
        repetition: { 
          count: repetitionCount, 
          attempts: totalSessionCounts.repetition || 0,
          dailyAttempts: todaySessionCounts.repetition || 0
        },
        comprehensive: { 
          count: allQuestions.length, 
          attempts: totalSessionCounts.comprehensive || 0,
          dailyAttempts: todaySessionCounts.comprehensive || 0
        }
      }
    })
  }
  
  return analyticsData
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
 * 共有試験をインポート
 */
export async function importSharedExam(
  userId: string,
  examId: string
): Promise<ExamSet> {
  const supabase = await createClient()
  
  const { data: originalExam, error: fetchError } = await supabase
    .from('exam_sets')
    .select('title, data')
    .eq('id', examId)
    .eq('is_shared', true)
    .single()
  
  if (fetchError || !originalExam) throw new Error('共有試験が見つかりません')
  
  const { data, error } = await supabase
    .from('exam_sets')
    .insert({
      title: `${originalExam.title} (コピー)`,
      user_id: userId,
      data: originalExam.data,
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
 * 試験のいいね状態を切り替え、新しいいいね数と状態を返す (RPC)
 */
export async function toggleExamLike(
  examId: string, 
  userId: string
): Promise<{ isLiked: boolean; likesCount: number }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('toggle_exam_like_and_update_count', { 
      p_exam_id: examId, 
      p_user_id: userId 
    })
  
  if (error) {
    console.error('Toggle like RPC error:', error)
    throw error
  }
  
  return data
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