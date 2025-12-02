'use client'

import { createContext, useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { MediaFile } from '@/entities/media'
import type { MediaGalleryState, MediaGalleryReducerAction, MediaGalleryHandlers } from '../types/mediaGalaryTypes'

const initialState: MediaGalleryState = {
  files: [],
  loading: false,
  error: null,
  selectedFiles: [],
  view: 'grid',
  sortBy: 'date',
  sortOrder: 'desc',
}

function mediaGalleryReducer(state: MediaGalleryState, action: MediaGalleryReducerAction): MediaGalleryState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.loading }

    case 'SET_ERROR':
      return { ...state, error: action.error }

    case 'SET_FILES':
      return {
        ...state,
        files: action.files,
        loading: false,
        selectedFiles: state.selectedFiles.filter((key) =>
          action.files.some((file) => file.key === key)
        ),
      }

    case 'DELETE_FILE':
      return {
        ...state,
        files: state.files.filter((file) => file.key !== action.fileKey),
        selectedFiles: state.selectedFiles.filter((key) => key !== action.fileKey),
      }

    case 'SELECT_FILE':
      return {
        ...state,
        selectedFiles: state.selectedFiles.includes(action.fileKey)
          ? state.selectedFiles
          : [...state.selectedFiles, action.fileKey],
      }

    case 'DESELECT_FILE':
      return {
        ...state,
        selectedFiles: state.selectedFiles.filter((key) => key !== action.fileKey),
      }

    case 'SELECT_ALL_FILES':
      return {
        ...state,
        selectedFiles: state.files.map((file) => file.key),
      }

    case 'DESELECT_ALL_FILES':
      return {
        ...state,
        selectedFiles: [],
      }

    case 'SET_VIEW':
      return { ...state, view: action.view }

    case 'SET_SORT_BY':
      return { ...state, sortBy: action.sortBy }

    case 'SET_SORT_ORDER':
      return { ...state, sortOrder: action.sortOrder }

    default:
      return state
  }
}

export const MediaGalleryContext = createContext<{
  state: MediaGalleryState
  actions: MediaGalleryHandlers
} | null>(null)

interface MediaGalleryProviderProps {
  children: ReactNode
  autoRefreshInterval?: number
}

export function MediaGalleryProvider({
  children,
  autoRefreshInterval = 5000,
}: MediaGalleryProviderProps) {
  const [state, dispatch] = useReducer(mediaGalleryReducer, initialState)

  const fetchFiles = useCallback(async (): Promise<MediaFile[]> => {
    const response = await fetch('/api/media')
    if (!response.ok) {
      throw new Error('Failed to fetch media files')
    }
    return response.json()
  }, [])

  const refreshFiles = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', loading: true })
    dispatch({ type: 'SET_ERROR', error: null })

    try {
      const files = await fetchFiles()
      dispatch({ type: 'SET_FILES', files })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load files'
      dispatch({ type: 'SET_LOADING', loading: false })
      dispatch({ type: 'SET_ERROR', error: errorMessage })
    }
  }, [fetchFiles])

  const deleteFile = useCallback(async (fileKey: string) => {
    try {
      const response = await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: fileKey }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      dispatch({ type: 'DELETE_FILE', fileKey })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file'
      dispatch({ type: 'SET_ERROR', error: errorMessage })
      throw error
    }
  }, [])

  const actions = useMemo(
    (): MediaGalleryHandlers => ({
      refreshFiles,

      selectFile: (fileKey: string) => {
        dispatch({ type: 'SELECT_FILE', fileKey })
      },

      deselectFile: (fileKey: string) => {
        dispatch({ type: 'DESELECT_FILE', fileKey })
      },

      selectAllFiles: () => {
        dispatch({ type: 'SELECT_ALL_FILES' })
      },

      deselectAllFiles: () => {
        dispatch({ type: 'DESELECT_ALL_FILES' })
      },

      setView: (view: 'grid' | 'list') => {
        dispatch({ type: 'SET_VIEW', view })
      },

      setSortBy: (sortBy: 'name' | 'date' | 'size') => {
        dispatch({ type: 'SET_SORT_BY', sortBy })
      },

      setSortOrder: (sortOrder: 'asc' | 'desc') => {
        dispatch({ type: 'SET_SORT_ORDER', sortOrder })
      },

      deleteFile,

      deleteSelectedFiles: async () => {
        const deletePromises = state.selectedFiles.map((key) => deleteFile(key))
        await Promise.allSettled(deletePromises)
      },
    }),
    [refreshFiles, deleteFile, state.selectedFiles],
  )

  // Auto-refresh functionality
  useEffect(() => {
    refreshFiles() // Initial load

    if (autoRefreshInterval > 0) {
      const interval = setInterval(refreshFiles, autoRefreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshFiles, autoRefreshInterval])

  return (
    <MediaGalleryContext.Provider value={{ state, actions }}>
      {children}
    </MediaGalleryContext.Provider>
  )
}
