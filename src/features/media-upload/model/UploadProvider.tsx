'use client'

import { createContext, useCallback, useMemo, useReducer, type ReactNode } from 'react'
import type { UploadState, UploadAction, UploadFile } from '@/entities/media'

const initialState: UploadState = {
  files: [],
  isUploading: false,
  progress: {},
  errors: {},
}

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'ADD_FILES': {
      const newFiles: UploadFile[] = action.files.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'pending',
      }))

      return {
        ...state,
        files: [...state.files, ...newFiles],
      }
    }

    case 'UPDATE_PROGRESS': {
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.fileId]: action.progress,
        },
      }
    }

    case 'SET_STATUS': {
      return {
        ...state,
        files: state.files.map((file) =>
          file.id === action.fileId
            ? { ...file, status: action.status, error: action.error }
            : file,
        ),
        errors: action.error ? { ...state.errors, [action.fileId]: action.error } : state.errors,
        isUploading:
          action.status === 'uploading' ||
          state.files.some(
            (f) => f.id !== action.fileId && (f.status === 'uploading' || f.status === 'pending'),
          ),
      }
    }

    case 'REMOVE_FILE': {
      const fileToRemove = state.files.find((f) => f.id === action.fileId)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl)
      }

      const newProgress = { ...state.progress }
      const newErrors = { ...state.errors }
      delete newProgress[action.fileId]
      delete newErrors[action.fileId]

      return {
        ...state,
        files: state.files.filter((file) => file.id !== action.fileId),
        progress: newProgress,
        errors: newErrors,
      }
    }

    case 'CLEAR_COMPLETED': {
      const completedFiles = state.files.filter(
        (f) => f.status === 'success' || f.status === 'error',
      )

      // Cleanup object URLs
      completedFiles.forEach((file) => {
        URL.revokeObjectURL(file.previewUrl)
      })

      const remainingFiles = state.files.filter(
        (f) => f.status === 'pending' || f.status === 'uploading',
      )
      const newProgress: Record<string, number> = {}
      const newErrors: Record<string, string> = {}

      remainingFiles.forEach((file) => {
        if (state.progress[file.id] !== undefined) {
          newProgress[file.id] = state.progress[file.id]
        }
        if (state.errors[file.id]) {
          newErrors[file.id] = state.errors[file.id]
        }
      })

      return {
        ...state,
        files: remainingFiles,
        progress: newProgress,
        errors: newErrors,
      }
    }

    default:
      return state
  }
}

export interface UploadActions {
  addFiles: (files: File[]) => void
  uploadFile: (fileId: string) => Promise<void>
  updateProgress: (fileId: string, progress: number) => void
  setStatus: (fileId: string, status: UploadFile['status'], error?: string) => void
  removeFile: (fileId: string) => void
  clearCompleted: () => void
}

export const UploadContext = createContext<{
  state: UploadState
  actions: UploadActions
} | null>(null)

interface UploadProviderProps {
  children: ReactNode
}

export function UploadProvider({ children }: UploadProviderProps) {
  const [state, dispatch] = useReducer(uploadReducer, initialState)

  const uploadFile = useCallback(
    async (fileId: string) => {
      const file = state.files.find((f) => f.id === fileId)
      if (!file || file.status !== 'pending') return

      try {
        dispatch({ type: 'SET_STATUS', fileId, status: 'uploading' })

        // Generate upload URL
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.file.name,
            fileType: file.file.type,
            fileSize: file.file.size,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to get upload URL')
        }

        const { url, key } = await response.json()

        // Upload file with progress tracking
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            dispatch({ type: 'UPDATE_PROGRESS', fileId, progress })
          }
        }

        xhr.onload = () => {
          if (xhr.status === 200) {
            dispatch({ type: 'SET_STATUS', fileId, status: 'success' })
            dispatch({ type: 'UPDATE_PROGRESS', fileId, progress: 100 })
          } else {
            dispatch({ type: 'SET_STATUS', fileId, status: 'error', error: 'Upload failed' })
          }
        }

        xhr.onerror = () => {
          dispatch({ type: 'SET_STATUS', fileId, status: 'error', error: 'Upload failed' })
        }

        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.file.type)
        xhr.send(file.file)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        dispatch({ type: 'SET_STATUS', fileId, status: 'error', error: errorMessage })
      }
    },
    [state.files],
  )

  const actions = useMemo(
    (): UploadActions => ({
      addFiles: (files: File[]) => dispatch({ type: 'ADD_FILES', files }),
      uploadFile,
      updateProgress: (fileId: string, progress: number) =>
        dispatch({ type: 'UPDATE_PROGRESS', fileId, progress }),
      setStatus: (fileId: string, status: UploadFile['status'], error?: string) =>
        dispatch({ type: 'SET_STATUS', fileId, status, error }),
      removeFile: (fileId: string) => dispatch({ type: 'REMOVE_FILE', fileId }),
      clearCompleted: () => dispatch({ type: 'CLEAR_COMPLETED' }),
    }),
    [uploadFile],
  )

  return <UploadContext.Provider value={{ state, actions }}>{children}</UploadContext.Provider>
}
