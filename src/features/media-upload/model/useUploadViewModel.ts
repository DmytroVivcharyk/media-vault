'use client'

import { useCallback, useContext, useMemo } from 'react'
import { UploadContext } from './UploadProvider'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
]

export function useUploadViewModel() {
  const context = useContext(UploadContext)

  if (!context) {
    throw new Error('useUploadViewModel must be used within UploadProvider')
  }

  const { state, actions } = context

  // Computed properties
  const hasFiles = state.files.length > 0
  const isAnyUploading = state.files.some((f) => f.status === 'uploading')
  const completedCount = state.files.filter((f) => f.status === 'success').length
  const errorCount = state.files.filter((f) => f.status === 'error').length
  const pendingCount = state.files.filter((f) => f.status === 'pending').length

  const totalProgress = useMemo(() => {
    if (state.files.length === 0) return 0
    const total = state.files.reduce((sum, file) => {
      return sum + (state.progress[file.id] ?? 0)
    }, 0)
    return Math.round(total / state.files.length)
  }, [state.files, state.progress])

  // Validation helpers
  const validateFiles = useCallback((files: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(
          `${file.name}: File too large (max ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB)`,
        )
      } else if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: File type not supported`)
      } else {
        validFiles.push(file)
      }
    })

    return { validFiles, errors }
  }, [])

  // Enhanced actions with additional logic
  const handleFileDrop = useCallback(
    async (files: File[]) => {
      const { validFiles, errors } = validateFiles(files)

      if (errors.length > 0) {
        console.warn('File validation errors:', errors)
        window.alert('Some files were not added:\n' + errors.join('\n'))
      }

      if (validFiles.length > 0) {
        actions.addFiles(validFiles)
      }
    },
    [validateFiles, actions],
  )

  const startBatchUpload = useCallback(async () => {
    const pendingFiles = state.files.filter((f) => f.status === 'pending')

    // Upload with concurrency control (max 3 simultaneous uploads)
    const uploadPromises: Promise<void>[] = []
    const maxConcurrency = 3

    for (let i = 0; i < pendingFiles.length; i += maxConcurrency) {
      const batch = pendingFiles.slice(i, i + maxConcurrency)
      const batchPromises = batch.map((file) => actions.uploadFile(file.id))
      uploadPromises.push(...batchPromises)

      // Wait for current batch to complete before starting next batch
      await Promise.allSettled(batchPromises)
    }
  }, [state.files, actions])

  const uploadSingleFile = useCallback(
    async (fileId: string) => {
      await actions.uploadFile(fileId)
    },
    [actions],
  )

  const retryFailedUploads = useCallback(async () => {
    const failedFiles = state.files.filter((f) => f.status === 'error')

    // Reset failed files to pending status
    failedFiles.forEach((file) => {
      actions.setStatus(file.id, 'pending')
    })

    // Start batch upload for failed files
    await startBatchUpload()
  }, [state.files, actions, startBatchUpload])

  const removeAllFiles = useCallback(() => {
    state.files.forEach((file) => {
      actions.removeFile(file.id)
    })
  }, [state.files, actions])

  return {
    // State
    files: state.files,
    isUploading: state.isUploading,
    errors: state.errors,
    progress: state.progress,

    // Computed
    hasFiles,
    isAnyUploading,
    completedCount,
    errorCount,
    pendingCount,
    totalProgress,

    // Actions
    handleFileDrop,
    uploadSingleFile,
    startBatchUpload,
    retryFailedUploads,
    removeFile: actions.removeFile,
    removeAllFiles,
    clearCompleted: actions.clearCompleted,

    // Helpers
    validateFiles,
  } as const
}
