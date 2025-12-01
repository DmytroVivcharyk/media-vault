'use client'

import { uploadManager } from '@/features/upload/model/uploadManager'
import { useState, useRef } from 'react'

export function UploadZone() {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    uploadManager.addFiles(Array.from(files))
    uploadManager.uploadAll()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={[
        'border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer',
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
      ].join(' ')}
      onClick={() => fileInputRef.current?.click()}
    >
      <p className="text-center text-gray-500">
        Drag & Drop images here or <span className="text-blue-600">click to select</span>
      </p>

      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
