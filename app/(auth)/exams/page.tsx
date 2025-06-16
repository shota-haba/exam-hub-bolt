'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { ExamList } from '@/components/features/exam-browser/ExamList'
import { SearchBar } from '@/components/features/exam-browser/SearchBar'
import { SortToggle } from '@/components/features/exam-browser/SortToggle'
import { ExamImport } from '@/components/features/exam-manager/ExamImport'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState as useDialogState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function ExamsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'difficulty'>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [importDialogOpen, setImportDialogOpen] = useDialogState(false)

  const handleSortChange = (newSortBy: 'title' | 'created_at' | 'difficulty') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('asc')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Exam Library"
          description="Browse and manage available exams"
        />
        
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Import Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import New Exam</DialogTitle>
              <DialogDescription>
                Upload a JSON file containing exam questions and metadata
              </DialogDescription>
            </DialogHeader>
            <ExamImport onSuccess={() => setImportDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search exams..."
        />
        
        <SortToggle
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
        />
      </div>

      <ExamList
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}