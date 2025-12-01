'use client'

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { MediaFile, MediaGalleryState } from '@/entities/media'

const initialState: MediaGalleryState = {
  files: [],
  loading: false,
  error: null,
  selectedFiles: [],
  view: 'grid',
  sortBy: 'date',
  sortOrder: 'desc',
}

export interface MediaGalleryActions {
  refreshFiles: () => Promise<void>
  selectFile: (fileKey: string) => void
  deselectFile: (fileKey: string) => void
  selectAllFiles: () => void
  deselectAllFiles: () => void
  setView: (view: 'grid' | 'list') => void
  setSortBy: (sortBy: 'name' | 'date' | 'size') => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
  deleteFile: (fileKey: string) => Promise<void>
  deleteSelectedFiles: () => Promise<void>
}

export const MediaGalleryContext = createContext<{
  state: MediaGalleryState
  actions: MediaGalleryActions
} | null>(null)

interface MediaGalleryProviderProps {
  children: ReactNode
  autoRefreshInterval?: number
}

export function MediaGalleryProvider({
  children,
  autoRefreshInterval = 5000,
}: MediaGalleryProviderProps) {
  const [state, setState] = useState<MediaGalleryState>(initialState)

  const fetchFiles = useCallback(async (): Promise<MediaFile[]> => {
    const response = await fetch('/api/media')
    if (!response.ok) {
      throw new Error('Failed to fetch media files')
    }
    return response.json()
  }, [])

  const refreshFiles = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const files = await fetchFiles()
      setState((prev) => ({
        ...prev,
        files,
        loading: false,
        // Clear selection if selected files no longer exist
        selectedFiles: prev.selectedFiles.filter((key) => files.some((file) => file.key === key)),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load files'
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
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

      setState((prev) => ({
        ...prev,
        files: prev.files.filter((file) => file.key !== fileKey),
        selectedFiles: prev.selectedFiles.filter((key) => key !== fileKey),
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file'
      setState((prev) => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  const actions = useMemo(
    (): MediaGalleryActions => ({
      refreshFiles,

      selectFile: (fileKey: string) => {
        setState((prev) => ({
          ...prev,
          selectedFiles: prev.selectedFiles.includes(fileKey)
            ? prev.selectedFiles
            : [...prev.selectedFiles, fileKey],
        }))
      },

      deselectFile: (fileKey: string) => {
        setState((prev) => ({
          ...prev,
          selectedFiles: prev.selectedFiles.filter((key) => key !== fileKey),
        }))
      },

      selectAllFiles: () => {
        setState((prev) => ({
          ...prev,
          selectedFiles: prev.files.map((file) => file.key),
        }))
      },

      deselectAllFiles: () => {
        setState((prev) => ({ ...prev, selectedFiles: [] }))
      },

      setView: (view: 'grid' | 'list') => {
        setState((prev) => ({ ...prev, view }))
      },

      setSortBy: (sortBy: 'name' | 'date' | 'size') => {
        setState((prev) => ({ ...prev, sortBy }))
      },

      setSortOrder: (sortOrder: 'asc' | 'desc') => {
        setState((prev) => ({ ...prev, sortOrder }))
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
