/*
  # ゲーミフィケーション機能の実装

  1. 新しいテーブル
    - `user_points` - ユーザーのポイント管理
    - `exam_levels` - 試験別レベル管理
    - `point_transactions` - ポイント獲得履歴
    - `login_streaks` - ログイン連続記録

  2. セキュリティ
    - 各テーブルでRLS有効化
    - ユーザー自身のデータのみアクセス可能

  3. 関数
    - ポイント計算・レベルアップ処理
    - ログインボーナス計算
*/

-- ユーザーポイントテーブル
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  daily_points INTEGER NOT NULL DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 試験別レベルテーブル
CREATE TABLE IF NOT EXISTS exam_levels (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exam_sets(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  current_exp INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, exam_id)
);

-- ポイント獲得履歴テーブル
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exam_sets(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'login', 'session_complete', 'perfect_score', 'streak_bonus'
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ログイン連続記録テーブル
CREATE TABLE IF NOT EXISTS login_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_streaks ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can manage their own points"
  ON user_points FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own exam levels"
  ON exam_levels FOR ALL TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own point transactions"
  ON point_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own login streaks"
  ON login_streaks FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ポイント獲得処理関数
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_exam_id UUID,
  p_transaction_type TEXT,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_new_level INTEGER;
  v_level_up BOOLEAN := FALSE;
  v_current_exp INTEGER;
  v_exp_to_next INTEGER;
BEGIN
  -- ポイント履歴を記録
  INSERT INTO point_transactions (user_id, exam_id, transaction_type, points, description)
  VALUES (p_user_id, p_exam_id, p_transaction_type, p_points, p_description);

  -- ユーザーポイントを更新（日計リセット処理含む）
  INSERT INTO user_points (user_id, total_points, daily_points, last_daily_reset)
  VALUES (p_user_id, p_points, p_points, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = user_points.total_points + p_points,
    daily_points = CASE 
      WHEN user_points.last_daily_reset < CURRENT_DATE THEN p_points
      ELSE user_points.daily_points + p_points
    END,
    last_daily_reset = CURRENT_DATE,
    updated_at = NOW();

  -- 試験別レベルを更新（試験IDがある場合のみ）
  IF p_exam_id IS NOT NULL THEN
    INSERT INTO exam_levels (user_id, exam_id, current_exp, total_points)
    VALUES (p_user_id, p_exam_id, p_points, p_points)
    ON CONFLICT (user_id, exam_id) DO UPDATE SET
      current_exp = exam_levels.current_exp + p_points,
      total_points = exam_levels.total_points + p_points,
      updated_at = NOW();

    -- レベルアップ判定
    SELECT current_exp, level INTO v_current_exp, v_new_level
    FROM exam_levels 
    WHERE user_id = p_user_id AND exam_id = p_exam_id;

    WHILE v_current_exp >= 100 LOOP
      v_new_level := v_new_level + 1;
      v_current_exp := v_current_exp - 100;
      v_level_up := TRUE;
    END LOOP;

    IF v_level_up THEN
      UPDATE exam_levels 
      SET level = v_new_level, current_exp = v_current_exp
      WHERE user_id = p_user_id AND exam_id = p_exam_id;
    END IF;

    v_exp_to_next := 100 - v_current_exp;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', p_points,
    'level_up', v_level_up,
    'new_level', v_new_level,
    'current_exp', v_current_exp,
    'exp_to_next', v_exp_to_next
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ログインボーナス処理関数
CREATE OR REPLACE FUNCTION process_login_bonus(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_bonus_points INTEGER := 10;
  v_streak_bonus INTEGER := 0;
  v_last_login DATE;
BEGIN
  -- ログイン連続記録を取得・更新
  SELECT current_streak, last_login_date INTO v_current_streak, v_last_login
  FROM login_streaks WHERE user_id = p_user_id;

  IF v_last_login IS NULL OR v_last_login < CURRENT_DATE THEN
    -- 新規または日付が変わった場合
    IF v_last_login = CURRENT_DATE - INTERVAL '1 day' THEN
      -- 連続ログイン
      v_current_streak := v_current_streak + 1;
    ELSE
      -- 連続記録リセット
      v_current_streak := 1;
    END IF;

    -- 連続ログインボーナス計算
    IF v_current_streak >= 7 THEN
      v_streak_bonus := 25;
    ELSIF v_current_streak >= 3 THEN
      v_streak_bonus := 10;
    END IF;

    -- ログイン記録更新
    INSERT INTO login_streaks (user_id, current_streak, longest_streak, last_login_date)
    VALUES (p_user_id, v_current_streak, v_current_streak, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
      current_streak = v_current_streak,
      longest_streak = GREATEST(login_streaks.longest_streak, v_current_streak),
      last_login_date = CURRENT_DATE,
      updated_at = NOW();

    -- ポイント付与
    PERFORM award_points(
      p_user_id, 
      NULL, 
      'login', 
      v_bonus_points + v_streak_bonus,
      CASE 
        WHEN v_streak_bonus > 0 THEN format('ログインボーナス + %s日連続ボーナス', v_current_streak)
        ELSE 'ログインボーナス'
      END
    );

    RETURN jsonb_build_object(
      'bonus_awarded', true,
      'base_points', v_bonus_points,
      'streak_bonus', v_streak_bonus,
      'total_points', v_bonus_points + v_streak_bonus,
      'current_streak', v_current_streak
    );
  ELSE
    RETURN jsonb_build_object('bonus_awarded', false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ユーザー統計取得関数
CREATE OR REPLACE FUNCTION get_user_gamification_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_points RECORD;
  v_login_streak RECORD;
  v_exam_levels JSONB;
BEGIN
  -- ユーザーポイント取得
  SELECT * INTO v_user_points FROM user_points WHERE user_id = p_user_id;
  
  -- ログイン連続記録取得
  SELECT * INTO v_login_streak FROM login_streaks WHERE user_id = p_user_id;
  
  -- 試験別レベル取得
  SELECT jsonb_agg(
    jsonb_build_object(
      'examId', exam_id,
      'level', level,
      'currentExp', current_exp,
      'expToNext', 100 - current_exp,
      'totalPoints', total_points
    )
  ) INTO v_exam_levels
  FROM exam_levels WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'userPoints', COALESCE(row_to_json(v_user_points), '{"total_points": 0, "daily_points": 0}'::json),
    'loginStreak', COALESCE(row_to_json(v_login_streak), '{"current_streak": 0, "longest_streak": 0}'::json),
    'examLevels', COALESCE(v_exam_levels, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数実行権限付与
GRANT EXECUTE ON FUNCTION award_points(UUID, UUID, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_login_bonus(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_gamification_stats(UUID) TO authenticated;

-- 更新時刻自動更新トリガー
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_exam_levels_updated_at
  BEFORE UPDATE ON exam_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_login_streaks_updated_at
  BEFORE UPDATE ON login_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();