import { useCallback, useState } from 'react'

interface UseDragAndDropProps {
  onFileDrop: (files: File[]) => void
}

export function useDragAndDrop({ onFileDrop }: UseDragAndDropProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const files = Array.from(e.dataTransfer.files)
      onFileDrop(files)
    },
    [onFileDrop],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // Only set dragging to false if we're leaving the drop zone, not just moving between child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      onFileDrop(files)
      // Reset input value to allow selecting the same file again
      e.target.value = ''
    },
    [onFileDrop],
  )

  return {
    isDragging,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleFileSelect,
  }
}