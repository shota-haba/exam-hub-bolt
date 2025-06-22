'use client'

import { ExamSet } from '@/lib/types'
import { transformExamForExport } from '@/lib/schemas/exam'

interface ExportExamButtonProps {
  exam: ExamSet
}

export function ExportExamButton({ exam }: ExportExamButtonProps) {
  const handleExport = () => {
    try {
      const exportData = transformExamForExport({
        id: exam.id,
        title: exam.title,
        tags: exam.data?.tags || [],
        questions: exam.data?.questions || []
      })

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exam.title}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <button 
      onClick={handleExport}
      className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent"
    >
      エクスポート
    </button>
  )
}