import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <Button size="lg" asChild>
        <Link href="/dashboard">Googleでログイン</Link>
      </Button>
    </div>
  )
}