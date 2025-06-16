'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { importExamAction } from '@/actions/exam'
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
          description: '試験をインポートしました',
        })
      } else {
        toast({
          title: 'インポートエラー',
          description: result.error || 'インポートに失敗しました',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Card className="border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 transition-colors">
      <CardHeader>
        <CardTitle className="text-gray-900">試験インポート</CardTitle>
        <CardDescription className="text-gray-600">
          JSON形式の問題集をアップロード
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileDropzone
          onFileAccepted={handleFileAccepted}
          disabled={isPending}
        />
        {isPending && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              インポート中...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}