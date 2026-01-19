'use client'

import { createContext, useMemo, useReducer, type ReactNode } from 'react'
import { uploadReducer, initialState } from './reducer'
import { createUploadActions } from './actions'
import type { UploadState, UploadHandlers } from '../types/mediaUploadTypes'

export const UploadContext = createContext<{
  state: UploadState
  actions: UploadHandlers
} | null>(null)

interface UploadProviderProps {
  children: ReactNode
}

export function UploadProvider({ children }: UploadProviderProps) {
  const [state, dispatch] = useReducer(uploadReducer, initialState)

  const baseActions = useMemo(() => createUploadActions(dispatch), [dispatch])

  const actions = useMemo<UploadHandlers>(
    () => ({
      ...baseActions,
      uploadFile: async (fileId: string) => {
        const file = state.files.find((f) => f.id === fileId)
        if (!file) return
        await baseActions.uploadFile(file)
      },
    }),
    [baseActions, state.files],
  )

  return <UploadContext.Provider value={{ state, actions }}>{children}</UploadContext.Provider>
}
