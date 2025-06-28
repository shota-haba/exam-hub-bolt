export interface UserPoints {
  totalPoints: number
  dailyPoints: number
  loginStreak: number
  lastLoginDate: string | null
}

export interface ExamLevel {
  examId: string
  level: number
  currentExp: number
  expToNext: number
  totalPoints: number
}

export interface PointsEarned {
  type: 'login' | 'session_complete' | 'perfect_score' | 'streak_bonus'
  points: number
  description: string
}

export const POINTS_CONFIG = {
  LOGIN: 10,
  SESSION_COMPLETE: 20,
  CORRECT_ANSWER: 5,
  PERFECT_SCORE: 50,
  STREAK_BONUS: 25,
  EXP_PER_LEVEL: 100
} as const