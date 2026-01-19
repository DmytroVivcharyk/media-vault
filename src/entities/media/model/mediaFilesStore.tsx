'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { MediaFile } from './types'
import { MediaApiClient } from '../api/mediaApiClient'

type ListState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: MediaFile[] }
  | { status: 'error'; error: string }

type MediaFilesStore = {
  list: ListState
  load: () => Promise<void>
  refresh: () => Promise<void>
  remove: (fileKey: string) => Promise<void>
  invalidate: () => void
}

const Ctx = createContext<MediaFilesStore | null>(null)

export function MediaFilesProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<ListState>({ status: 'idle' })

  const refresh = useCallback(async () => {
    setList({ status: 'loading' })
    try {
      const files = await MediaApiClient.fetchMediaFiles()
      setList({ status: 'ready', data: files })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load files'
      setList({ status: 'error', error: msg })
    }
  }, [])

  const load = useCallback(async () => {
    // dedupe: only load once
    if (list.status === 'loading' || list.status === 'ready') return
    await refresh()
  }, [list.status, refresh])

  const remove = useCallback(async (fileKey: string) => {
    await MediaApiClient.deleteMediaFile(fileKey)
    setList((prev) => {
      if (prev.status !== 'ready') return prev
      return { status: 'ready', data: prev.data.filter((f) => f.key !== fileKey) }
    })
  }, [])

  const invalidate = useCallback(() => setList({ status: 'idle' }), [])

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
