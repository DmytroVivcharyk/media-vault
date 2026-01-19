import { MediaApiClient } from '@/entities/media/api/mediaApiClient'
import type { MediaGalleryReducerAction, MediaGalleryHandlers } from '../types/mediaGalaryTypes'

export function createMediaGalleryActions(
  dispatch: React.Dispatch<MediaGalleryReducerAction>,
): MediaGalleryHandlers {
  const refreshFiles = async () => {
    dispatch({ type: 'SET_LOADING', loading: true })
    dispatch({ type: 'SET_ERROR', error: null })

    try {
      const files = await MediaApiClient.fetchMediaFiles()
      dispatch({ type: 'SET_FILES', files })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load files'
      dispatch({ type: 'SET_LOADING', loading: false })
      dispatch({ type: 'SET_ERROR', error: errorMessage })
    }
  }

  const deleteFile = async (fileKey: string) => {
    try {
      await MediaApiClient.deleteMediaFile(fileKey)
      dispatch({ type: 'DELETE_FILE', fileKey })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file'
      dispatch({ type: 'SET_ERROR', error: errorMessage })
      throw error
    }
  }

  const selectFile = (fileKey: string) => {
    dispatch({ type: 'SELECT_FILE', fileKey })
  }

  const deselectFile = (fileKey: string) => {
    dispatch({ type: 'DESELECT_FILE', fileKey })
  }

  const selectAllFiles = () => {
    dispatch({ type: 'SELECT_ALL_FILES' })
  }

  const deselectAllFiles = () => {
    dispatch({ type: 'DESELECT_ALL_FILES' })
  }

  const setView = (view: 'grid' | 'list') => {
    dispatch({ type: 'SET_VIEW', view })
  }

  const setSortBy = (sortBy: 'name' | 'date' | 'size') => {
    dispatch({ type: 'SET_SORT_BY', sortBy })
  }

  const setSortOrder = (sortOrder: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT_ORDER', sortOrder })
  }

  const deleteSelectedFiles = async (keys: string[]) => {
    await Promise.allSettled(keys.map(deleteFile))
  }

  return {
    refreshFiles,
    deleteFile,
    selectFile,
    deselectFile,
    selectAllFiles,
    deselectAllFiles,
    setView,
    setSortBy,
    setSortOrder,
    deleteSelectedFiles,
  }
}
