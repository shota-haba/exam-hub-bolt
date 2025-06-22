'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { importExamAction } from '@/lib/actions/exam'
import { useToast } from '@/hooks/use-toast'

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
    <Card>
      <CardHeader>
        <CardTitle>試験データインポート</CardTitle>
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
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b border-foreground"></div>
              処理中...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}