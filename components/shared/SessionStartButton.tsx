'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SessionSetupModal } from '@/components/features/exam-session/SessionSetupModal'
import { ExamModeStats } from '@/lib/types'

interface SessionStartButtonProps {
  examId: string
  modeStats: ExamModeStats
  children: React.ReactNode
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function SessionStartButton({ 
  examId, 
  modeStats, 
  children, 
  className,
  size = "default",
  variant = "default"
}: SessionStartButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className={className}
        size={size}
        variant={variant}
      >
        {children}
      </Button>
      
      <SessionSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        examId={examId}
        modeStats={modeStats}
      />
    </>
  )
}