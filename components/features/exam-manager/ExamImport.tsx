'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FileDropzone } from '@/components/ui/file-dropzone'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/shared/AuthProvider'
import { supabase } from '@/lib/supabase/client'
import { examSchema } from '@/lib/schemas/exam'
import { Upload, FileText } from 'lucide-react'

interface ExamImportProps {
  onSuccess?: () => void
}

export function ExamImport({ onSuccess }: ExamImportProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [examData, setExamData] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    estimated_duration: '',
    is_public: false
  })

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      // Validate the exam data structure
      const result = examSchema.safeParse(data)
      if (!result.success) {
        toast({
          title: "Invalid file format",
          description: "The uploaded file doesn't match the expected exam format",
          variant: "destructive"
        })
        return
      }

      setExamData(data)
      
      // Pre-fill form with data from file if available
      if (data.title) setFormData(prev => ({ ...prev, title: data.title }))
      if (data.description) setFormData(prev => ({ ...prev, description: data.description }))
      if (data.difficulty) setFormData(prev => ({ ...prev, difficulty: data.difficulty }))
      if (data.estimated_duration) setFormData(prev => ({ ...prev, estimated_duration: data.estimated_duration.toString() }))

      toast({
        title: "File loaded",
        description: `Found ${data.questions?.length || 0} questions`
      })
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "Please ensure the file is valid JSON format",
        variant: "destructive"
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!examData || !user) return

    setLoading(true)
    try {
      // Create the exam
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: formData.title,
          description: formData.description || null,
          difficulty: formData.difficulty,
          estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
          is_public: formData.is_public,
          created_by: user.id,
          question_count: examData.questions?.length || 0
        })
        .select()
        .single()

      if (examError) throw examError

      // Create the questions
      const questions = examData.questions.map((q: any, index: number) => ({
        exam_id: exam.id,
        question_text: q.question,
        question_type: q.type || 'multiple_choice',
        options: q.options || [],
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
        order_index: index
      }))

      const { error: questionsError } = await supabase
        .from('exam_questions')
        .insert(questions)

      if (questionsError) throw questionsError

      toast({
        title: "Exam imported successfully",
        description: `"${formData.title}" has been added to the library`
      })

      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "An error occurred while importing the exam",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {!examData ? (
        <div className="space-y-4">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Exam File</h3>
            <p className="text-sm text-gray-500 mb-4">
              Select a JSON file containing exam questions and metadata
            </p>
          </div>
          
          <FileDropzone
            onFileSelect={handleFileUpload}
            accept=".json"
            maxSize={5 * 1024 * 1024} // 5MB
          />
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>Expected format:</p>
            <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
{`{
  "title": "Exam Title",
  "description": "Description",
  "difficulty": "intermediate",
  "questions": [
    {
      "question": "Question text?",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Why A is correct"
    }
  ]
}`}
            </pre>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <FileText className="h-4 w-4" />
              <span className="font-medium">File loaded successfully</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {examData.questions?.length || 0} questions found
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => 
                  setFormData(prev => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.estimated_duration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                min="1"
              />
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
              />
              <Label htmlFor="public">Make public</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading || !formData.title}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Exam
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExamData(null)}
            >
              Choose Different File
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}