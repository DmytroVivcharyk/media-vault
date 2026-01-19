'use client'

import { createContext, useMemo, useReducer, type ReactNode } from 'react'
import { mediaGalleryReducer, initialState } from './reducer'
import { createMediaGalleryActions } from './actions'

import type { MediaGalleryState, MediaGalleryHandlers } from '../types/mediaGalaryTypes'

export const MediaGalleryContext = createContext<{
  state: MediaGalleryState
  actions: MediaGalleryHandlers
} | null>(null)

interface MediaGalleryProviderProps {
  children: ReactNode
}

export function MediaGalleryProvider({ children }: MediaGalleryProviderProps) {
  const [state, dispatch] = useReducer(mediaGalleryReducer, initialState)
  const actions = useMemo(
    (): MediaGalleryHandlers => createMediaGalleryActions(dispatch),
    [dispatch],
  )

  return (
    <MediaGalleryContext.Provider value={{ state, actions }}>
      {children}
    </MediaGalleryContext.Provider>
  )
}
