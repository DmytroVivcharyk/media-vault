'use client'

import { createContext, useCallback, useMemo, useReducer, type ReactNode } from 'react'
import type { UploadFile } from '@/entities/media'
import type { UploadState, UploadReducerAction, UploadHandlers } from '../types/mediaUploadTypes'
import { uploadService } from '../services/uploadService'

const initialState: UploadState = {
  files: [],
  isUploading: false,
  progress: {},
  errors: {},
}

function uploadReducer(state: UploadState, action: UploadReducerAction): UploadState {
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

export const UploadContext = createContext<{
  state: UploadState
  actions: UploadHandlers
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

        await uploadService.uploadFile(file.file, {
          onProgress: (progress) => {
            dispatch({ type: 'UPDATE_PROGRESS', fileId, progress })
          },
        })

        dispatch({ type: 'SET_STATUS', fileId, status: 'success' })
      } catch (error) {
        dispatch({
          type: 'SET_STATUS',
          fileId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        })
      }
    },
    [state.files],
  )

  const actions = useMemo(
    (): UploadHandlers => ({
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
