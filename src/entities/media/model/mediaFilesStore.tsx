'use client'

import { createContext, useCallback, useMemo, useReducer, type ReactNode } from 'react'
import { initialState, reducer } from './reducer'
import { createMediaFileActions } from './actions'
import type { MediaFilesStore } from './types'

export const Ctx = createContext<MediaFilesStore | null>(null)

export function MediaFilesProvider({ children }: { children: ReactNode }) {
  const [list, dispatch] = useReducer(reducer, initialState)

  const baseActions = useMemo(() => createMediaFileActions(dispatch), [dispatch])

  const load = useCallback(async () => {
    if (list.status === 'loading' || list.status === 'ready') return
    await baseActions.refresh()
  }, [list.status, baseActions])

  const value = useMemo(() => ({ ...baseActions, list, load }), [list, load, baseActions])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
