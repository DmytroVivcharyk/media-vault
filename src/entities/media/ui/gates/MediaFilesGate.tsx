'use client'

import { useEffect } from 'react'
import { useMediaFiles } from '../../model/mediaFilesStore'

export function MediaFilesGate({ autoRefreshInterval = 0 }: { autoRefreshInterval?: number }) {
  const { load, refresh } = useMediaFiles()

  useEffect(() => {
    load()

    if (autoRefreshInterval > 0) {
      const id = setInterval(refresh, autoRefreshInterval)
      return () => clearInterval(id)
    }
  }, [load, refresh, autoRefreshInterval])

  return null
}
