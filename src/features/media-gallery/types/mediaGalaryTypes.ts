import type { MediaFile } from '@/entities/media'

export type GalleryState = 'loading' | 'error' | 'empty' | 'ready'

export type MediaGalleryReducerAction =
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_FILES'; files: MediaFile[] }
  | { type: 'DELETE_FILE'; fileKey: string }
  | { type: 'SELECT_FILE'; fileKey: string }
  | { type: 'DESELECT_FILE'; fileKey: string }
  | { type: 'SELECT_ALL_FILES' }
  | { type: 'DESELECT_ALL_FILES' }
  | { type: 'SET_VIEW'; view: 'grid' | 'list' }
  | { type: 'SET_SORT_BY'; sortBy: 'name' | 'date' | 'size' }
  | { type: 'SET_SORT_ORDER'; sortOrder: 'asc' | 'desc' }

export interface MediaGalleryState {
  readonly files: MediaFile[]
  readonly loading: boolean
  readonly error: string | null
  readonly selectedFiles: string[]
  readonly view: 'grid' | 'list'
  readonly sortBy: 'name' | 'date' | 'size'
  readonly sortOrder: 'asc' | 'desc'
}

export interface MediaGalleryHandlers {
  refreshFiles: () => Promise<void>
  selectFile: (fileKey: string) => void
  deselectFile: (fileKey: string) => void
  selectAllFiles: () => void
  deselectAllFiles: () => void
  setView: (view: 'grid' | 'list') => void
  setSortBy: (sortBy: 'name' | 'date' | 'size') => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
  deleteFile: (fileKey: string) => Promise<void>
  deleteSelectedFiles: (keys: string[]) => Promise<void>
}
