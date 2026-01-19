'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { MediaFile } from './types'
import { MediaApiClient } from '../api/mediaApiClient'

type ListState =
  | { status: 'idle' }
  | { status: 'loading'; data?: MediaFile[] }
  | { status: 'ready'; data: MediaFile[] }
  | { status: 'error'; error: string; data?: MediaFile[] }

type MediaFilesStore = {
  list: ListState
  load: () => Promise<void>
  refresh: () => Promise<void>
  remove: (fileKey: string) => Promise<void>
  invalidate: () => void
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; files: MediaFile[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'REMOVE_OPTIMISTIC'; fileKey: string }
  | { type: 'INVALIDATE' }

const initialState: ListState = { status: 'idle' }

function reducer(state: ListState, action: Action): ListState {
  switch (action.type) {
    case 'LOAD_START': {
      // keep existing data if we have it (prevents 8 -> 0 -> 8)
      const prevData =
        state.status === 'ready' ? state.data :
        state.status === 'loading' ? state.data :
        state.status === 'error' ? state.data :
        undefined

      return { status: 'loading', data: prevData }
    }

    case 'LOAD_SUCCESS':
      return { status: 'ready', data: action.files }

    case 'LOAD_ERROR': {
      const prevData =
        state.status === 'ready' ? state.data :
        state.status === 'loading' ? state.data :
        state.status === 'error' ? state.data :
        undefined

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

const Ctx = createContext<MediaFilesStore | null>(null)

export function MediaFilesProvider({ children }: { children: ReactNode }) {
  const [list, dispatch] = useReducer(reducer, initialState)

  const refresh = useCallback(async () => {
    dispatch({ type: 'LOAD_START' })
    try {
      const files = await MediaApiClient.fetchMediaFiles()
      dispatch({ type: 'LOAD_SUCCESS', files })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load files'
      dispatch({ type: 'LOAD_ERROR', error: msg })
    }
  }, [])

  const load = useCallback(async () => {
    if (list.status === 'loading' || list.status === 'ready') return
    await refresh()
  }, [list.status, refresh])

  const remove = useCallback(async (fileKey: string) => {
    dispatch({ type: 'REMOVE_OPTIMISTIC', fileKey })

    try {
      await MediaApiClient.deleteMediaFile(fileKey)
    } catch (e) {
      await refresh()
      throw e
    }
  }, [refresh])

  const invalidate = useCallback(() => {
    dispatch({ type: 'INVALIDATE' })
  }, [])

  const value = useMemo(
    () => ({ list, load, refresh, remove, invalidate }),
    [list, load, refresh, remove, invalidate],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMediaFiles() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMediaFiles must be used within MediaFilesProvider')
  return ctx
}
