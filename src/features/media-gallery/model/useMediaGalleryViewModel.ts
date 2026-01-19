'use client'

import { useCallback, useMemo } from 'react'
import { useMediaFiles } from '@/entities/media/model/mediaFilesStore'
import { useMediaGallery } from './useMediaGallery'

import type { MediaFile } from '@/entities/media'
import type { GalleryState } from '../types/mediaGalaryTypes'

export function useMediaGalleryViewModel() {
  const context = useMediaGallery()
  const { state, actions } = context

  const media = useMediaFiles()
  const files = useMemo(() => (media.list.status === 'ready' ? media.list.data : []), [media.list])
  const loading = media.list.status === 'idle' || media.list.status === 'loading'
  const error = media.list.status === 'error' ? media.list.error : null

  // Computed properties
  const hasFiles = files.length > 0
  const hasSelectedFiles = state.selectedFiles.length > 0
  const allFilesSelected = files.length > 0 && state.selectedFiles.length === files.length

  // Sorted and filtered files
  const sortedFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      let comparison = 0

      switch (state.sortBy) {
        case 'name': {
          const aName = a.fileName || a.key
          const bName = b.fileName || b.key
          comparison = aName.localeCompare(bName)
          break
        }
        case 'date': {
          const aDate = a.lastModified || new Date(0)
          const bDate = b.lastModified || new Date(0)
          comparison = new Date(aDate).getTime() - new Date(bDate).getTime()
          break
        }
        case 'size': {
          const aSize = a.fileSize || 0
          const bSize = b.fileSize || 0
          comparison = aSize - bSize
          break
        }
      }

      return state.sortOrder === 'desc' ? -comparison : comparison
    })

    return sorted
  }, [files, state.sortBy, state.sortOrder])

  // Selection helpers
  const isFileSelected = useCallback(
    (fileKey: string) => {
      return state.selectedFiles.includes(fileKey)
    },
    [state.selectedFiles],
  )

  const toggleFileSelection = useCallback(
    (fileKey: string) => {
      if (isFileSelected(fileKey)) {
        actions.deselectFile(fileKey)
      } else {
        actions.selectFile(fileKey)
      }
    },
    [isFileSelected, actions],
  )

  const toggleAllSelection = useCallback(() => {
    if (allFilesSelected) {
      actions.deselectAllFiles()
    } else {
      actions.selectAllFiles(files.map((f) => f.key))
    }
  }, [allFilesSelected, actions, files])

  // File operations
  const handleDeleteFile = useCallback(
    async (fileKey: string) => {
      try {
        await media.remove(fileKey)
        actions.deselectFile(fileKey) // keep selection consistent
      } catch (e) {
        console.error('Delete failed:', e)
        window.alert('Failed to delete file.')
      }
    },
    [media, actions],
  )

  const handleDeleteSelected = useCallback(async () => {
    if (!hasSelectedFiles) return
    try {
      await Promise.allSettled(state.selectedFiles.map(media.remove))
      actions.deselectAllFiles()
    } catch (e) {
      console.error('Batch delete failed:', e)
      window.alert('Failed to delete selected files.')
    }
  }, [hasSelectedFiles, state.selectedFiles, media, actions])

  // View controls
  const toggleView = useCallback(() => {
    actions.setView(state.view === 'grid' ? 'list' : 'grid')
  }, [state.view, actions])

  const handleSortChange = useCallback(
    (sortBy: 'name' | 'date' | 'size') => {
      if (state.sortBy === sortBy) {
        // If clicking same sort field, toggle order
        actions.setSortOrder(state.sortOrder === 'asc' ? 'desc' : 'asc')
      } else {
        // If clicking different field, set new sort and default to desc
        actions.setSortBy(sortBy)
        actions.setSortOrder('desc')
      }
    },
    [state.sortBy, state.sortOrder, actions],
  )

  // File type helpers
  const getFileType = useCallback((file: MediaFile): 'image' | 'video' | 'unknown' => {
    const mimeType = file.metadata?.mimeType || file.fileType
    if (!mimeType) return 'unknown'

    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    return 'unknown'
  }, [])

  const isImage = useCallback(
    (file: MediaFile) => {
      return getFileType(file) === 'image'
    },
    [getFileType],
  )

  const isVideo = useCallback(
    (file: MediaFile) => {
      return getFileType(file) === 'video'
    },
    [getFileType],
  )

  const viewGalleryState = useCallback((): GalleryState => {
    if (error) return 'error'
    if (loading && files.length === 0) return 'loading'
    if (files.length === 0) return 'empty'
    return 'ready'
  }, [error, loading, files.length])

  // Statistics
  const fileStats = useMemo(() => {
    const stats = {
      total: files.length,
      images: 0,
      videos: 0,
      totalSize: 0,
      selected: state.selectedFiles.length,
    }

    files.forEach((file) => {
      const type = getFileType(file)
      if (type === 'image') stats.images++
      if (type === 'video') stats.videos++
      if (file.fileSize) stats.totalSize += file.fileSize
    })

    return stats
  }, [files, state.selectedFiles.length, getFileType])

  return {
    // State
    files: sortedFiles,
    loading: loading,
    error: error,
    selectedFiles: state.selectedFiles,
    view: state.view,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,

    // Computed
    hasFiles,
    hasSelectedFiles,
    allFilesSelected,
    fileStats,

    // Actions
    refreshFiles: media.refresh,
    selectFile: actions.selectFile,
    deselectFile: actions.deselectFile,
    deselectAllFiles: actions.deselectAllFiles,
    toggleFileSelection,
    toggleAllSelection,
    handleDeleteFile,
    handleDeleteSelected,

    // View controls
    setView: actions.setView,
    toggleView,
    handleSortChange,

    // Helpers
    isFileSelected,
    getFileType,
    isImage,
    isVideo,

    // Gallery state
    viewGalleryState,
  } as const
}
