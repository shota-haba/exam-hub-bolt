'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteExamAction } from '@/lib/actions/exam'

interface DeleteExamButtonProps {
  examId: string
}

export function DeleteExamButton({ examId }: DeleteExamButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm('この試験を削除しますか？')) {
      return
    }

    startTransition(async () => {
      await deleteExamAction(examId)
    })
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="w-full text-left text-destructive hover:text-destructive px-2 py-1.5 text-sm"
    >
      削除
    </button>
  )
}