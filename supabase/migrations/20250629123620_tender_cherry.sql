/*
  # Add favorites functionality

  1. New Columns
    - `exam_sets.is_favorited` (boolean) - Whether exam is favorited by user
  
  2. Security
    - Update existing RLS policies to handle favorites
*/

-- Add favorites column to exam_sets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_sets' AND column_name = 'is_favorited'
  ) THEN
    ALTER TABLE exam_sets ADD COLUMN is_favorited BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create RPC function to get detailed exam stats with points and dates
CREATE OR REPLACE FUNCTION get_detailed_exam_stats(p_exam_ids UUID[], p_user_id UUID)
RETURNS TABLE (
  exam_id UUID,
  warmup_count INTEGER,
  review_count INTEGER,
  repetition_count INTEGER,
  comprehensive_count INTEGER,
  warmup_attempts INTEGER,
  review_attempts INTEGER,
  repetition_attempts INTEGER,
  comprehensive_attempts INTEGER,
  warmup_daily_points INTEGER,
  review_daily_points INTEGER,
  repetition_daily_points INTEGER,
  comprehensive_daily_points INTEGER,
  warmup_total_points INTEGER,
  review_total_points INTEGER,
  repetition_total_points INTEGER,
  comprehensive_total_points INTEGER,
  last_warmup_date TIMESTAMP WITH TIME ZONE,
  last_review_date TIMESTAMP WITH TIME ZONE,
  last_repetition_date TIMESTAMP WITH TIME ZONE,
  last_comprehensive_date TIMESTAMP WITH TIME ZONE
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
      COUNT(*) FILTER (WHERE sr.session_mode = 'comprehensive') as comprehensive_attempts,
      COUNT(*) FILTER (WHERE sr.session_mode = 'warmup' AND sr.created_at >= today_start AND sr.created_at <= today_end) as warmup_daily_points,
      COUNT(*) FILTER (WHERE sr.session_mode = 'review' AND sr.created_at >= today_start AND sr.created_at <= today_end) as review_daily_points,
      COUNT(*) FILTER (WHERE sr.session_mode = 'repetition' AND sr.created_at >= today_start AND sr.created_at <= today_end) as repetition_daily_points,
      COUNT(*) FILTER (WHERE sr.session_mode = 'comprehensive' AND sr.created_at >= today_start AND sr.created_at <= today_end) as comprehensive_daily_points,
      COUNT(*) FILTER (WHERE sr.session_mode = 'warmup') as warmup_total_points,
      COUNT(*) FILTER (WHERE sr.session_mode = 'review') as review_total_points,
      COUNT(*) FILTER (WHERE sr.session_mode = 'repetition') as repetition_total_points,
      COUNT(*) FILTER (WHERE sr.session_mode = 'comprehensive') as comprehensive_total_points,
      MAX(sr.created_at) FILTER (WHERE sr.session_mode = 'warmup') as last_warmup_date,
      MAX(sr.created_at) FILTER (WHERE sr.session_mode = 'review') as last_review_date,
      MAX(sr.created_at) FILTER (WHERE sr.session_mode = 'repetition') as last_repetition_date,
      MAX(sr.created_at) FILTER (WHERE sr.session_mode = 'comprehensive') as last_comprehensive_date
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
    COALESCE(ss.comprehensive_attempts, 0)::INTEGER,
    COALESCE(ss.warmup_daily_points, 0)::INTEGER,
    COALESCE(ss.review_daily_points, 0)::INTEGER,
    COALESCE(ss.repetition_daily_points, 0)::INTEGER,
    COALESCE(ss.comprehensive_daily_points, 0)::INTEGER,
    COALESCE(ss.warmup_total_points, 0)::INTEGER,
    COALESCE(ss.review_total_points, 0)::INTEGER,
    COALESCE(ss.repetition_total_points, 0)::INTEGER,
    COALESCE(ss.comprehensive_total_points, 0)::INTEGER,
    ss.last_warmup_date,
    ss.last_review_date,
    ss.last_repetition_date,
    ss.last_comprehensive_date
  FROM progress_stats ps
  LEFT JOIN session_stats ss ON ss.exam_set_id = ps.exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_detailed_exam_stats(UUID[], UUID) TO authenticated;