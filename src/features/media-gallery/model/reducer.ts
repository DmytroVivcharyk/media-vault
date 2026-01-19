import type { MediaGalleryState, MediaGalleryReducerAction } from '../types/mediaGalaryTypes'

export const initialState: MediaGalleryState = {
  files: [],
  loading: false,
  error: null,
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
          action.files.some((file) => file.key === key),
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
