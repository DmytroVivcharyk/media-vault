import type { MediaGalleryReducerAction, MediaGalleryHandlers } from '../types/mediaGalaryTypes'

export function createMediaGalleryActions(
  dispatch: React.Dispatch<MediaGalleryReducerAction>,
): MediaGalleryHandlers {
  return {
    selectFile: (fileKey: string) => dispatch({ type: 'SELECT_FILE', fileKey }),
    deselectFile: (fileKey: string) => dispatch({ type: 'DESELECT_FILE', fileKey }),
    selectAllFiles: (fileKeys: string[]) => dispatch({ type: 'SELECT_ALL_FILES', fileKeys }),
    deselectAllFiles: () => dispatch({ type: 'DESELECT_ALL_FILES' }),
    setView: (view: 'grid' | 'list') => dispatch({ type: 'SET_VIEW', view }),
    setSortBy: (sortBy: 'name' | 'date' | 'size') => dispatch({ type: 'SET_SORT_BY', sortBy }),
    setSortOrder: (sortOrder: 'asc' | 'desc') => dispatch({ type: 'SET_SORT_ORDER', sortOrder }),
  }
}
