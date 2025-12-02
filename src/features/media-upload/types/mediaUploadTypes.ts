import type { MediaFileStatus, UploadFile } from '@/entities/media'

export type UploadReducerAction =
  | { type: 'ADD_FILES'; files: File[] }
  | { type: 'UPDATE_PROGRESS'; fileId: string; progress: number }
  | { type: 'SET_STATUS'; fileId: string; status: MediaFileStatus; error?: string }
  | { type: 'REMOVE_FILE'; fileId: string }
  | { type: 'CLEAR_COMPLETED' }

export interface UploadState {
  readonly files: UploadFile[]
  readonly isUploading: boolean
  readonly progress: Record<string, number>
  readonly errors: Record<string, string>
}

export interface UploadHandlers {
  addFiles: (files: File[]) => void
  uploadFile: (fileId: string) => Promise<void>
  updateProgress: (fileId: string, progress: number) => void
  setStatus: (fileId: string, status: UploadFile['status'], error?: string) => void
  removeFile: (fileId: string) => void
  clearCompleted: () => void
}
