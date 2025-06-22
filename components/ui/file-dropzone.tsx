'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void
  disabled?: boolean
  className?: string
}

export function FileDropzone({ onFileAccepted, disabled = false, className }: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0])
    }
  }, [onFileAccepted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false,
    disabled
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer transition-colors",
        isDragActive && "border-primary bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">
        {isDragActive
          ? "ファイルをドロップしてください"
          : "JSONファイルをドラッグ&ドロップまたはクリックして選択"}
      </p>
    </div>
  )
}