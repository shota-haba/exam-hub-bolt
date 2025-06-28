import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { BookOpen, Zap, Target, Trophy, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                Smart Learning Platform
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Exam Hub
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                効率的な学習で目標達成をサポートする
                <br />
                次世代学習プラットフォーム
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                  学習を開始
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">学習を加速する機能</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                4つの学習モードとゲーミフィケーション要素で、継続的な学習をサポート
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">予習モード</h3>
                  <p className="text-sm text-muted-foreground">
                    未学習の問題に集中して基礎力を構築
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto">
                    <Target className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">復習モード</h3>
                  <p className="text-sm text-muted-foreground">
                    間違えた問題を重点的に復習
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold">反復モード</h3>
                  <p className="text-sm text-muted-foreground">
                    正解した問題の知識を定着
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">総合モード</h3>
                  <p className="text-sm text-muted-foreground">
                    全問題での実力測定
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                今すぐ学習を始めましょう
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                効率的な学習システムで、あなたの目標達成をサポートします
              </p>
            </div>
            
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                学習を開始
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}