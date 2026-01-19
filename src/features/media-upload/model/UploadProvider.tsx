'use client'

import { createContext, useMemo, useReducer, type ReactNode } from 'react'
import { uploadReducer, initialState } from './reducer'
import { createUploadActions } from './actions'
import type { UploadState, UploadHandlers } from '../types/mediaUploadTypes'

export const UploadContext = createContext<{
  state: UploadState
  actions: UploadHandlers
} | null>(null)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uploadReducer, initialState)

  const base = useMemo(() => createUploadActions(dispatch), [dispatch])

  const actions = useMemo<UploadHandlers>(
    () => ({
      ...base,
      uploadFile: async (fileId: string) => {
        const file = state.files.find((f) => f.id === fileId)
        if (!file) return
        await base.uploadFile(file)
      },
    }),
    [base, state.files],
  )

  return <UploadContext.Provider value={{ state, actions }}>{children}</UploadContext.Provider>
}
