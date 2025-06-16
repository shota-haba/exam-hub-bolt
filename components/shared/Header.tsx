'use client'

import { useAuth } from '@/components/shared/AuthProvider'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

export default function Header() {
  const { user, signInWithGoogle, signOut, loading } = useAuth()

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('サインイン失敗:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('サインアウト失敗:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              E
            </div>
            <span className="text-xl font-semibold text-gray-900">Exam Hub</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          {user && (
            <>
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                ダッシュボード
              </Link>
              <Link 
                href="/exams" 
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                試験管理
              </Link>
            </>
          )}
        </nav>
        
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full" />
          ) : !user ? (
            <Button onClick={handleSignIn} className="px-6">
              Googleでログイン
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url || ''} 
                      alt={user.user_metadata?.name || 'User'} 
                    />
                    <AvatarFallback className="bg-gray-100 text-xs">
                      {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">
                      {user.user_metadata?.name || 'ユーザー'}
                    </p>
                    <p className="w-[200px] truncate text-xs text-gray-500">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    ダッシュボード
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/exams" className="cursor-pointer">
                    試験管理
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}