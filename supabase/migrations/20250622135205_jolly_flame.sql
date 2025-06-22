/*
  # Analytics RPC Functions

  1. New Functions
    - `get_user_analytics` - Get comprehensive analytics data for dashboard
    - `get_exam_mode_stats_bulk` - Get mode statistics for multiple exams efficiently
  
  2. Performance
    - Reduce N+1 queries by processing data in database
    - Minimize data transfer between client and server
    - Optimize complex aggregations
*/

-- Function to get comprehensive analytics data for a user
CREATE OR REPLACE FUNCTION get_user_analytics(p_user_id UUID)
RETURNS TABLE (
  exam_id UUID,
  exam_title TEXT,
  warmup_count INTEGER,
  review_count INTEGER,
  repetition_count INTEGER,
  comprehensive_count INTEGER,
  daily_sessions INTEGER,
  total_sessions INTEGER,
  warmup_attempts INTEGER,
  review_attempts INTEGER,
  repetition_attempts INTEGER,
  comprehensive_attempts INTEGER,
  warmup_daily_attempts INTEGER,
  review_daily_attempts INTEGER,
  repetition_daily_attempts INTEGER,
  comprehensive_daily_attempts INTEGER
) AS $$
DECLARE
  today_start TIMESTAMP WITH TIME ZONE;
  today_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate today's date range in UTC
  today_start := date_trunc('day', NOW() AT TIME ZONE 'UTC');
  today_end := today_start + INTERVAL '1 day' - INTERVAL '1 millisecond';

  RETURN QUERY
  WITH exam_questions AS (
    SELECT 
      es.id as exam_id,
      es.title as exam_title,
      jsonb_array_length(es.data->'questions') as total_questions
    FROM exam_sets es
    WHERE es.user_id = p_user_id
  ),
  progress_stats AS (
    SELECT 
      eq.exam_id,
      eq.exam_title,
      eq.total_questions,
      COALESCE(COUNT(up.question_id) FILTER (WHERE up.last_result IS NULL), 0) as warmup_count,
      COALESCE(COUNT(up.question_id) FILTER (WHERE up.last_result = false), 0) as review_count,
      COALESCE(COUNT(up.question_id) FILTER (WHERE up.last_result = true), 0) as repetition_count
    FROM exam_questions eq
    LEFT JOIN user_progress up ON up.exam_set_id = eq.exam_id AND up.user_id = p_user_id
    GROUP BY eq.exam_id, eq.exam_title, eq.total_questions
  ),
  session_stats AS (
    SELECT 
      sr.exam_set_id,
      COUNT(*) as total_sessions,
      COUNT(*) FILTER (WHERE sr.created_at >= today_start AND sr.created_at <= today_end) as daily_sessions,
      COUNT(*) FILTER (WHERE sr.session_mode = 'warmup') as warmup_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'review') as review_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'repetition') as repetition_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'comprehensive') as comprehensive_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'warmup' AND sr.created_at >= today_start AND sr.created_at <= today_end) as warmup_daily_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'review' AND sr.created_at >= today_start AND sr.created_at <= today_end) as review_daily_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'repetition' AND sr.created_at >= today_start AND sr.created_at <= today_end) as repetition_daily_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'comprehensive' AND sr.created_at >= today_start AND sr.created_at <= today_end) as comprehensive_daily_attempts
    FROM session_results sr
    WHERE sr.user_id = p_user_id
    GROUP BY sr.exam_set_id
  )
  SELECT 
    ps.exam_id,
    ps.exam_title,
    (ps.total_questions - COALESCE(ps.review_count, 0) - COALESCE(ps.repetition_count, 0))::INTEGER as warmup_count,
    ps.review_count::INTEGER,
    ps.repetition_count::INTEGER,
    ps.total_questions::INTEGER as comprehensive_count,
    COALESCE(ss.daily_sessions, 0)::INTEGER,
    COALESCE(ss.total_sessions, 0)::INTEGER,
    COALESCE(ss.warmup_attempts, 0)::INTEGER,
    COALESCE(ss.review_attempts, 0)::INTEGER,
    COALESCE(ss.repetition_attempts, 0)::INTEGER,
    COALESCE(ss.comprehensive_attempts, 0)::INTEGER,
    COALESCE(ss.warmup_daily_attempts, 0)::INTEGER,
    COALESCE(ss.review_daily_attempts, 0)::INTEGER,
    COALESCE(ss.repetition_daily_attempts, 0)::INTEGER,
    COALESCE(ss.comprehensive_daily_attempts, 0)::INTEGER
  FROM progress_stats ps
  LEFT JOIN session_stats ss ON ss.exam_set_id = ps.exam_id
  ORDER BY ps.exam_title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get mode statistics for multiple exams efficiently
CREATE OR REPLACE FUNCTION get_exam_mode_stats_bulk(p_exam_ids UUID[], p_user_id UUID)
RETURNS TABLE (
  exam_id UUID,
  warmup_count INTEGER,
  review_count INTEGER,
  repetition_count INTEGER,
  comprehensive_count INTEGER,
  warmup_attempts INTEGER,
  review_attempts INTEGER,
  repetition_attempts INTEGER,
  comprehensive_attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH exam_questions AS (
    SELECT 
      es.id as exam_id,
      jsonb_array_length(es.data->'questions') as total_questions
    FROM exam_sets es
    WHERE es.id = ANY(p_exam_ids)
  ),
  progress_stats AS (
    SELECT 
      eq.exam_id,
      eq.total_questions,
      COALESCE(COUNT(up.question_id) FILTER (WHERE up.last_result IS NULL), 0) as warmup_count,
      COALESCE(COUNT(up.question_id) FILTER (WHERE up.last_result = false), 0) as review_count,
      COALESCE(COUNT(up.question_id) FILTER (WHERE up.last_result = true), 0) as repetition_count
    FROM exam_questions eq
    LEFT JOIN user_progress up ON up.exam_set_id = eq.exam_id AND up.user_id = p_user_id
    GROUP BY eq.exam_id, eq.total_questions
  ),
  session_stats AS (
    SELECT 
      sr.exam_set_id,
      COUNT(*) FILTER (WHERE sr.session_mode = 'warmup') as warmup_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'review') as review_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'repetition') as repetition_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'comprehensive') as comprehensive_attempts
    FROM session_results sr
    WHERE sr.user_id = p_user_id AND sr.exam_set_id = ANY(p_exam_ids)
    GROUP BY sr.exam_set_id
  )
  SELECT 
    ps.exam_id,
    (ps.total_questions - COALESCE(ps.review_count, 0) - COALESCE(ps.repetition_count, 0))::INTEGER as warmup_count,
    ps.review_count::INTEGER,
    ps.repetition_count::INTEGER,
    ps.total_questions::INTEGER as comprehensive_count,
    COALESCE(ss.warmup_attempts, 0)::INTEGER,
    COALESCE(ss.review_attempts, 0)::INTEGER,
    COALESCE(ss.repetition_attempts, 0)::INTEGER,
    COALESCE(ss.comprehensive_attempts, 0)::INTEGER
  FROM progress_stats ps
  LEFT JOIN session_stats ss ON ss.exam_set_id = ps.exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_exam_mode_stats_bulk(UUID[], UUID) TO authenticated;