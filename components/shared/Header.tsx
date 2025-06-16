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
      console.error('Sign in failed:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-6">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background font-bold text-xs">
              E
            </div>
            <span className="font-semibold">Exam Hub</span>
          </Link>
          
          {user && (
            <nav className="flex items-center space-x-6">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                ダッシュボード
              </Link>
              <Link 
                href="/exams" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                試験管理
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="h-6 w-6 bg-muted animate-pulse rounded-full" />
          ) : !user ? (
            <Button onClick={handleSignIn} size="sm">
              ログイン
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-6 w-6 rounded-full">
                  <Avatar className="h-6 w-6">
                    <AvatarImage 
                      src={user.user_metadata?.avatar_url || ''} 
                      alt={user.user_metadata?.name || 'User'} 
                    />
                    <AvatarFallback className="text-xs">
                      {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">
                      {user.user_metadata?.name || 'User'}
                    </p>
                    <p className="w-[180px] truncate text-xs text-muted-foreground">
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
                  className="text-destructive focus:text-destructive cursor-pointer"
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