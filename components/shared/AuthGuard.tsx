'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * 認証が必要なページを保護するコンポーネント
 * 未認証ユーザーをリダイレクトし、認証ロジックを一元管理
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      fallback || (
        <div className="flex-1 flex items-center justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}