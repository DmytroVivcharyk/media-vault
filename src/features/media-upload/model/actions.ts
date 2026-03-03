import { uploadService } from '../services/uploadService'
import type { UploadReducerAction } from '../types/mediaUploadTypes'
import type { UploadFile } from '@/entities/media'

export async function uploadFileImpl(
  dispatch: React.Dispatch<UploadReducerAction>,
  file: UploadFile,
): Promise<void> {
  if (file.status !== 'pending') return

  const fileId = file.id

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
    uploadFile: (file: UploadFile) => uploadFileImpl(dispatch, file),
    updateProgress: (fileId: string, progress: number) =>
      dispatch({ type: 'UPDATE_PROGRESS', fileId, progress }),
    setStatus: (fileId: string, status: UploadFile['status'], error?: string) =>
      dispatch({ type: 'SET_STATUS', fileId, status, error }),
    removeFile: (fileId: string) => dispatch({ type: 'REMOVE_FILE', fileId }),
    clearCompleted: () => dispatch({ type: 'CLEAR_COMPLETED' }),
  }
}
