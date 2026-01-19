import type { MediaGalleryState, MediaGalleryReducerAction } from '../types/mediaGalaryTypes'

export const initialState: MediaGalleryState = {
  selectedFiles: [],
  view: 'grid',
  sortBy: 'date',
  sortOrder: 'desc',
}

export function mediaGalleryReducer(
  state: MediaGalleryState,
  action: MediaGalleryReducerAction,
): MediaGalleryState {
  switch (action.type) {
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
      return { ...state, selectedFiles: action.fileKeys }

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
