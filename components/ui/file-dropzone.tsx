'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void
  disabled?: boolean
}

export function FileDropzone({ onFileAccepted, disabled }: FileDropzoneProps) {
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
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive 
          ? 'border-foreground bg-muted' 
          : 'border-muted-foreground hover:border-foreground hover:bg-muted/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground">
        {isDragActive
          ? 'ファイルをドロップしてください'
          : 'JSONファイルをドラッグ&ドロップまたはクリックして選択'}
      </p>
    </div>
  )
}