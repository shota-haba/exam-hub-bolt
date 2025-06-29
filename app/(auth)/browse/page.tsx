import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Tag } from 'lucide-react'
import { LikeButton } from '@/components/features/exam-browser/LikeButton'
import { SessionStartButton } from '@/components/shared/SessionStartButton'
import { getSharedExams, getUserExams, getBulkExamStatsByMode } from '@/lib/supabase/db'
import { ExamSet, ExamModeStats } from '@/lib/types'
import { ImportSharedExamButton } from '@/components/features/exam-browser/ImportSharedExamButton'
import { AuthGuard } from '@/components/shared/AuthGuard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface BrowsePageProps {
  searchParams: Promise<{
    search?: string
    sort?: string
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  return (
    <AuthGuard>
      <div className="content-container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Share</h2>
        </div>
        
        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <BrowseContent searchParams={searchParams} />
        </Suspense>
      </div>
    </AuthGuard>
  )
}

async function BrowseContent({ searchParams }: BrowsePageProps) {
  const { search, sort } = await searchParams
  const [sharedExams, userExams] = await Promise.all([
    getSharedExams({
      searchTerm: search,
      sortBy: sort as 'newest' | 'likes'
    }),
    getUserExams()
  ])

  const mySharedExams = userExams.filter(exam => exam.is_shared)
  
  // N+1問題を解決：全試験の統計を一括取得
  const allExamIds = [...mySharedExams.map(e => e.id), ...sharedExams.map(e => e.id)]
  const statsMap = await getBulkExamStatsByMode(allExamIds)

  return (
    <div className="space-y-6">
      {mySharedExams.length > 0 && (
        <div className="space-y-4">
          <h3 className="section-title">共有中の試験</h3>
          <div className="table-container">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[250px]">試験名</TableHead>
                  <TableHead className="text-center">設問数</TableHead>
                  <TableHead className="text-center">予習</TableHead>
                  <TableHead className="text-center">復習</TableHead>
                  <TableHead className="text-center">反復</TableHead>
                  <TableHead className="text-center">総合</TableHead>
                  <TableHead className="text-center">いいね</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mySharedExams.map((exam) => {
                  const questionCount = exam.data?.questions?.length || 0;
                  const tags = exam.data?.tags || [];
                  const modeStats = statsMap.get(exam.id) || {
                    warmup: { count: 0, attempts: 0 },
                    review: { count: 0, attempts: 0 },
                    repetition: { count: 0, attempts: 0 },
                    comprehensive: { count: 0, attempts: 0 }
                  };
                  
                  return (
                    <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium">{exam.title}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(exam.created_at).toLocaleDateString()}
                        </div>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag.項目名}: {tag.値}
                              </Badge>
                            ))}
                            {tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{questionCount}</TableCell>
                      <TableCell className="text-center">{modeStats.warmup.count}</TableCell>
                      <TableCell className="text-center">{modeStats.review.count}</TableCell>
                      <TableCell className="text-center">{modeStats.repetition.count}</TableCell>
                      <TableCell className="text-center">{modeStats.comprehensive.count}</TableCell>
                      <TableCell className="text-center">{exam.likes_count}</TableCell>
                      <TableCell>
                        <SessionStartButton 
                          examId={exam.id} 
                          modeStats={modeStats}
                          size="sm"
                          className="w-full"
                        >
                          開始
                        </SessionStartButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <h3 className="section-title">共有試験</h3>
        
        {sharedExams.length > 0 ? (
          <div className="table-container">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[250px]">試験名</TableHead>
                  <TableHead className="text-center">設問数</TableHead>
                  <TableHead className="text-center">予習</TableHead>
                  <TableHead className="text-center">復習</TableHead>
                  <TableHead className="text-center">反復</TableHead>
                  <TableHead className="text-center">総合</TableHead>
                  <TableHead className="text-center">いいね</TableHead>
                  <TableHead className="w-[180px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharedExams.map((exam) => {
                  const questionCount = exam.data?.questions?.length || 0;
                  const tags = exam.data?.tags || [];
                  const modeStats = statsMap.get(exam.id) || {
                    warmup: { count: 0, attempts: 0 },
                    review: { count: 0, attempts: 0 },
                    repetition: { count: 0, attempts: 0 },
                    comprehensive: { count: 0, attempts: 0 }
                  };
                  
                  return (
                    <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-medium">{exam.title}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(exam.created_at).toLocaleDateString()}
                        </div>
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag.項目名}: {tag.値}
                              </Badge>
                            ))}
                            {tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{questionCount}</TableCell>
                      <TableCell className="text-center">{modeStats.warmup.count}</TableCell>
                      <TableCell className="text-center">{modeStats.review.count}</TableCell>
                      <TableCell className="text-center">{modeStats.repetition.count}</TableCell>
                      <TableCell className="text-center">{modeStats.comprehensive.count}</TableCell>
                      <TableCell className="text-center">
                        <LikeButton 
                          examId={exam.id}
                          initialLiked={exam.isLiked || false}
                          initialCount={exam.likes_count}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ImportSharedExamButton examId={exam.id} />
                          <SessionStartButton 
                            examId={exam.id} 
                            modeStats={modeStats}
                            size="sm"
                            className="flex-1"
                          >
                            開始
                          </SessionStartButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card className="border-dashed bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">共有試験なし</h3>
                <p className="text-sm text-muted-foreground">現在共有されている試験はありません</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}