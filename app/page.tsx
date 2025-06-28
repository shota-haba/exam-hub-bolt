import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
      <div className="flex flex-col items-center space-y-8 max-w-md text-center">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-foreground">
          <BookOpen className="h-8 w-8 text-background" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Exam Hub</h1>
        <p className="text-muted-foreground">
          効率的な学習管理と試験対策のためのプラットフォーム
        </p>
      </div>
    </div>
  )
}