import { UploadFile } from '../../../entities/media/model/types'
import { UploadState, UploadReducerAction } from '../types/mediaUploadTypes'

export const initialState: UploadState = {
  files: [],
  isUploading: false,
  progress: {},
  errors: {},
}

export function uploadReducer(state: UploadState, action: UploadReducerAction): UploadState {
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
