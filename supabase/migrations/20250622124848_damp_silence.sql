CREATE OR REPLACE FUNCTION toggle_exam_like_and_update_count(
  p_exam_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  has_liked BOOLEAN;
  new_likes_count INT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.exam_likes 
    WHERE exam_id = p_exam_id AND user_id = p_user_id
  ) INTO has_liked;

  IF has_liked THEN
    DELETE FROM public.exam_likes
    WHERE exam_id = p_exam_id AND user_id = p_user_id;

    UPDATE public.exam_sets
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = p_exam_id
    RETURNING likes_count INTO new_likes_count;

    RETURN jsonb_build_object('isLiked', false, 'likesCount', new_likes_count);
  ELSE
    INSERT INTO public.exam_likes (exam_id, user_id)
    VALUES (p_exam_id, p_user_id);

    UPDATE public.exam_sets
    SET likes_count = likes_count + 1
    WHERE id = p_exam_id
    RETURNING likes_count INTO new_likes_count;
    
    RETURN jsonb_build_object('isLiked', true, 'likesCount', new_likes_count);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION toggle_exam_like_and_update_count(UUID, UUID) TO authenticated;