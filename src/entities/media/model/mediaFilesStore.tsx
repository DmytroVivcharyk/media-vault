'use client'

import { createContext, useMemo, useReducer, type ReactNode } from 'react'
import { initialState, reducer } from './reducer'
import { createMediaFileActions, loadMediaFilesImpl } from './actions'
import type { MediaFilesStore } from './types'

export const Ctx = createContext<MediaFilesStore | null>(null)

interface Props {
  children: ReactNode
}

export function MediaFilesProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const baseActions = useMemo(() => createMediaFileActions(dispatch), [dispatch])

  const actions = useMemo<Omit<MediaFilesStore, 'list'>>(
    () => ({
      ...baseActions,
      load: () => loadMediaFilesImpl(dispatch, state),
    }),
    [state, baseActions, dispatch],
  )

  return <Ctx.Provider value={{ list: state, ...actions }}>{children}</Ctx.Provider>
}
