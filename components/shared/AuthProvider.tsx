'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import { processLoginBonusAction } from '@/lib/actions/gamification'
import { PointsToast } from '@/components/features/gamification/PointsToast'
import { PointsEarned } from '@/lib/types/gamification'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [pointsEarned, setPointsEarned] = useState<PointsEarned[]>([])

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // ログイン時にボーナス処理
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const result = await processLoginBonusAction()
          if (result.success && result.data?.bonus_awarded) {
            const loginBonus: PointsEarned = {
              type: 'login',
              points: result.data.total_points,
              description: result.data.current_streak > 1 
                ? `ログインボーナス + ${result.data.current_streak}日連続ボーナス`
                : 'ログインボーナス'
            }
            setPointsEarned([loginBonus])
          }
        } catch (error) {
          console.error('Login bonus processing failed:', error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <PointsToast 
        pointsEarned={pointsEarned} 
        onClear={() => setPointsEarned([])} 
      />
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth は AuthProvider の中で使用してください。')
  }
  return context
}