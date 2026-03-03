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

  const actions = useMemo(() => createUploadActions(dispatch), [dispatch])

  return <UploadContext.Provider value={{ state, actions }}>{children}</UploadContext.Provider>
}
