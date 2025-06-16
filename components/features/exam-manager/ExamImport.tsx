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
          title: 'Import complete',
          description: 'Exam data imported successfully',
        })
      } else {
        toast({
          title: 'Import failed',
          description: result.error || 'Failed to import exam data',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Card className="border-dashed bg-muted/20 hover:bg-muted/30 transition-colors">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Import Exam Data</CardTitle>
        <CardDescription className="text-xs">
          Upload JSON format question sets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileDropzone
          onFileAccepted={handleFileAccepted}
          disabled={isPending}
        />
        {isPending && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-foreground"></div>
              Processing...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}