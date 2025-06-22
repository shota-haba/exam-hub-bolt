'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { importSharedExamAction } from '@/lib/actions/exam'
import { useToast } from '@/hooks/use-toast'

interface ImportSharedExamButtonProps {
  examId: string
}

export function ImportSharedExamButton({ examId }: ImportSharedExamButtonProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleImport = () => {
    startTransition(async () => {
      const result = await importSharedExamAction(examId)
      if (result.success) {
        toast({
          title: 'インポート完了',
          description: '試験をインポートしました',
        })
      } else {
        toast({
          title: 'インポート失敗',
          description: result.error || 'インポートに失敗しました',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Button 
      onClick={handleImport}
      disabled={isPending}
      variant="outline" 
      className="flex-1"
      size="sm"
    >
      {isPending ? 'インポート中...' : 'インポート'}
    </Button>
  )
}