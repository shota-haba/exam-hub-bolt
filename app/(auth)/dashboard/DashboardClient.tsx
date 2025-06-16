'use client'

import { useState } from 'react'
import ExamList from '@/components/features/exam-browser/ExamList'
import { SessionSetupModal } from '@/components/features/exam-session/SessionSetupModal'
import { ExamSet, ExamModeStats } from '@/lib/types'

interface DashboardClientProps {
  userExamsWithStats: Array<{ exam: ExamSet; modeStats: ExamModeStats }>
  sharedExams: ExamSet[]
  activeTab: string
}

export default function DashboardClient({ 
  userExamsWithStats, 
  sharedExams, 
  activeTab 
}: DashboardClientProps) {
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleStartSession = (examId: string) => {
    setSelectedExamId(examId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedExamId(null)
  }

  const selectedExamStats = selectedExamId 
    ? userExamsWithStats.find(item => item.exam.id === selectedExamId)?.modeStats
    : null

  if (activeTab === 'my-exams') {
    return (
      <>
        <ExamList 
          exams={userExamsWithStats.map(item => item.exam)}
          modeStats={userExamsWithStats.reduce((acc, item) => {
            acc[item.exam.id] = item.modeStats
            return acc
          }, {} as Record<string, ExamModeStats>)}
          onStartSession={handleStartSession}
          emptyMessage="試験がありません。試験管理ページから問題集をインポートしてください。"
        />
        
        {selectedExamId && selectedExamStats && (
          <SessionSetupModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            examId={selectedExamId}
            modeStats={selectedExamStats}
          />
        )}
      </>
    )
  }

  return (
    <ExamList 
      exams={sharedExams} 
      showLikeButton={true}
      emptyMessage="共有試験がありません"
    />
  )
}