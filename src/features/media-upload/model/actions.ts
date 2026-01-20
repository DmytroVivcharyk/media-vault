import { uploadService } from '../services/uploadService'
import type { UploadReducerAction, UploadState } from '../types/mediaUploadTypes'
import type { UploadFile } from '@/entities/media'

export async function uploadFileImpl(
  dispatch: React.Dispatch<UploadReducerAction>,
  state: UploadState,
  fileId: string,
): Promise<void> {
  const file = state.files.find((f) => f.id === fileId)
  if (!file) return
  if (file.status !== 'pending') return

  try {
    dispatch({ type: 'SET_STATUS', fileId, status: 'uploading' })

    await uploadService.uploadFile(file.file, {
      onProgress: (progress) => dispatch({ type: 'UPDATE_PROGRESS', fileId, progress }),
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
}

export function createUploadActions(dispatch: React.Dispatch<UploadReducerAction>) {
  return {
    addFiles: (files: File[]) => dispatch({ type: 'ADD_FILES', files }),
    updateProgress: (fileId: string, progress: number) =>
      dispatch({ type: 'UPDATE_PROGRESS', fileId, progress }),
    setStatus: (fileId: string, status: UploadFile['status'], error?: string) =>
      dispatch({ type: 'SET_STATUS', fileId, status, error }),
    removeFile: (fileId: string) => dispatch({ type: 'REMOVE_FILE', fileId }),
    clearCompleted: () => dispatch({ type: 'CLEAR_COMPLETED' }),
  }
}
