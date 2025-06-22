'use client'

import { useAuth } from '@/components/shared/AuthProvider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export default function Header() {
  const { user, signInWithGoogle, signOut, loading } = useAuth()
  const pathname = usePathname()

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
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href={user ? "/dashboard" : "/"} className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">Exam Hub</span>
          </Link>
          {user && (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link 
                href="/dashboard" 
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  isActive("/dashboard") ? "text-foreground" : "text-foreground/60"
                )}
              >
                ダッシュボード
              </Link>
              <Link 
                href="/exams" 
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  isActive("/exams") ? "text-foreground" : "text-foreground/60"
                )}
              >
                試験管理
              </Link>
              <Link 
                href="/browse" 
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  isActive("/browse") ? "text-foreground" : "text-foreground/60"
                )}
              >
                共有
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {loading ? (
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          ) : !user ? (
            <Button onClick={handleSignIn} size="sm">
              ログイン
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
                    <AvatarFallback>
                      {(user.user_metadata?.name || user.email || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">
                      {user.user_metadata?.name || 'User'}
                    </p>
                    <p className="w-[200px] truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
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