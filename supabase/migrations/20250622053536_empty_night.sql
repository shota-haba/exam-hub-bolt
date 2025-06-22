/*
  # Create functions for likes count management

  1. Functions
    - `increment_likes_count` - Increment likes count for an exam
    - `decrement_likes_count` - Decrement likes count for an exam
  
  2. Security
    - Functions are accessible to authenticated users only
*/

-- Function to increment likes count
CREATE OR REPLACE FUNCTION increment_likes_count(exam_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE exam_sets 
  SET likes_count = likes_count + 1 
  WHERE id = exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement likes count
CREATE OR REPLACE FUNCTION decrement_likes_count(exam_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE exam_sets 
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = exam_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_likes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_likes_count(UUID) TO authenticated;