export type GalleryState = 'loading' | 'error' | 'empty' | 'ready'

export type MediaGalleryReducerAction =
  | { type: 'SELECT_FILE'; fileKey: string }
  | { type: 'DESELECT_FILE'; fileKey: string }
  | { type: 'SELECT_ALL_FILES'; fileKeys: string[] }
  | { type: 'DESELECT_ALL_FILES' }
  | { type: 'SET_VIEW'; view: 'grid' | 'list' }
  | { type: 'SET_SORT_BY'; sortBy: 'name' | 'date' | 'size' }
  | { type: 'SET_SORT_ORDER'; sortOrder: 'asc' | 'desc' }

export interface MediaGalleryState {
  readonly selectedFiles: string[]
  readonly view: 'grid' | 'list'
  readonly sortBy: 'name' | 'date' | 'size'
  readonly sortOrder: 'asc' | 'desc'
}

export type MediaGalleryHandlers = {
  selectFile: (fileKey: string) => void
  deselectFile: (fileKey: string) => void
  selectAllFiles: (fileKeys: string[]) => void
  deselectAllFiles: () => void
  setView: (view: 'grid' | 'list') => void
  setSortBy: (sortBy: 'name' | 'date' | 'size') => void
  setSortOrder: (sortOrder: 'asc' | 'desc') => void
}
