'use client'

import { createContext, useCallback, useMemo, useReducer, type ReactNode } from 'react'
import type { UploadFile } from '@/entities/media'
import type { UploadState, UploadReducerAction, UploadHandlers } from '../types/mediaUploadTypes'

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

  async function multipartUpload(fileId: string, file: File) {
    // 1. Start multipart upload
    const start = await fetch('/api/upload/multipart/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
    }).then((r) => r.json())
  
    const { uploadId, key } = start
  
    // 2. Chunk the file
    const CHUNK_SIZE = 8 * 1024 * 1024 // 8MB
    const chunks = Math.ceil(file.size / CHUNK_SIZE)
  
    const uploadedParts: { ETag: string; PartNumber: number }[] = []
  
    for (let partNumber = 1; partNumber <= chunks; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
  
      // 3. Request presigned URL for this part
      const { url } = await fetch('/api/upload/multipart/sign-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          uploadId,
          partNumber,
        }),
      }).then((r) => r.json())
  
      // 4. Upload part
      const xhr = new XMLHttpRequest()
  
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const totalUploaded = start + event.loaded
          const progress = Math.round((totalUploaded / file.size) * 100)
          dispatch({ type: 'UPDATE_PROGRESS', fileId, progress })
        }
      }
  
      const partETag = await new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          const ETag = xhr.getResponseHeader('ETag')
          if (ETag) resolve(ETag.replace(/"/g, ''))
          else reject(new Error('Missing ETag'))
        }
  
        xhr.onerror = () => reject(new Error('Chunk upload failed'))
  
        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(chunk)
      })
  
      uploadedParts.push({ ETag: partETag, PartNumber: partNumber })
    }
  
    // 5. Complete multipart upload
    await fetch('/api/upload/multipart/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        uploadId,
        parts: uploadedParts,
      }),
    })
  
    dispatch({ type: 'UPDATE_PROGRESS', fileId, progress: 100 })
    dispatch({ type: 'SET_STATUS', fileId, status: 'success' })
  }
  

  const uploadFile = useCallback(
    async (fileId: string) => {
      const file = state.files.find((f) => f.id === fileId)
      if (!file || file.status !== 'pending') return
  
      try {
        dispatch({ type: 'SET_STATUS', fileId, status: 'uploading' })
  
        // Large files → multipart
        if (file.file.size > 50 * 1024 * 1024) {
          await multipartUpload(fileId, file.file)
          return
        }
  
        // Otherwise: simple upload
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.file.name,
            fileType: file.file.type,
            fileSize: file.file.size,
          }),
        })
  
        if (!response.ok) throw new Error('Failed presigned upload URL')
  
        const { url } = await response.json()
  
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
