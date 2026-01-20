import type { ListState, Action } from './types'

export const initialState: ListState = { status: 'idle' }

export function reducer(state: ListState, action: Action): ListState {
  switch (action.type) {
    case 'LOAD_START': {
      const prevData =
        state.status === 'ready'
          ? state.data
          : state.status === 'loading'
            ? state.data
            : state.status === 'error'
              ? state.data
              : undefined

      return { status: 'loading', data: prevData }
    }

    case 'LOAD_SUCCESS':
      return { status: 'ready', data: action.files }

    case 'LOAD_ERROR': {
      const prevData =
        state.status === 'ready'
          ? state.data
          : state.status === 'loading'
            ? state.data
            : state.status === 'error'
              ? state.data
              : undefined

      return { status: 'error', error: action.error, data: prevData }
    }

    case 'REMOVE_OPTIMISTIC': {
      if (state.status !== 'ready') return state
      return { status: 'ready', data: state.data.filter((f) => f.key !== action.fileKey) }
    }

    case 'INVALIDATE':
      return { status: 'idle' }

    default:
      return state
  }
}
