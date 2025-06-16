import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex-1">
        <section className="py-20 px-4">
          <div className="container max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              Exam Hub
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              試験対策プラットフォーム
            </p>
            
            <Button size="lg" asChild className="px-8 py-3 text-lg">
              <Link href="/dashboard">開始</Link>
            </Button>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                title="予習"
                description="未学習問題"
                color="bg-blue-500"
              />
              <FeatureCard
                title="復習"
                description="間違えた問題"
                color="bg-red-500"
              />
              <FeatureCard
                title="反復"
                description="正解問題"
                color="bg-green-500"
              />
              <FeatureCard
                title="総合"
                description="全問題"
                color="bg-purple-500"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function FeatureCard({ 
  title, 
  description,
  color
}: { 
  title: string
  description: string
  color: string
}) {
  return (
    <Card className="text-center border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className={`mb-4 w-12 h-12 rounded-lg ${color} mx-auto flex items-center justify-center`}>
          <div className="w-6 h-6 bg-white rounded-sm opacity-90"></div>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}