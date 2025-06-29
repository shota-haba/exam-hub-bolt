'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { importExamAction } from '@/lib/actions/exam'
import { useToast } from '@/hooks/use-toast'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Upload } from 'lucide-react'

export function ExamImport() {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleFileAccepted = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const result = await importExamAction(formData)
      
      if (result.success) {
        toast({
          title: 'インポート完了',
          description: '試験データが正常にインポートされました',
        })
      } else {
        toast({
          title: 'インポート失敗',
          description: result.error || '試験データのインポートに失敗しました',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Card className="data-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          試験データインポート
        </CardTitle>
        <CardDescription>
          JSON形式の試験データをアップロード
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileDropzone
          onFileAccepted={handleFileAccepted}
          disabled={isPending}
        />
        {isPending && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoadingSpinner size="sm" />
              処理中...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}