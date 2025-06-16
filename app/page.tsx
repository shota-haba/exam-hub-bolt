import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Exam Analytics
            </h1>
            <p className="text-lg text-muted-foreground">
              試験対策分析プラットフォーム
            </p>
          </div>
          
          <Button size="lg" asChild>
            <Link href="/dashboard">開始</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}