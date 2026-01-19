'use client'

import { useEffect } from 'react'
import { useMediaGallery } from '../../model/useMediaGallery'

type MediaGalleryGateProps = {
  autoRefreshInterval: number
}

export function MediaGalleryGate({ autoRefreshInterval = 5000 }: MediaGalleryGateProps) {
  const { actions } = useMediaGallery()
  const refreshFiles = actions.refreshFiles

  useEffect(() => {
    refreshFiles()

    if (autoRefreshInterval > 0) {
      const id = setInterval(refreshFiles, autoRefreshInterval)
      return () => clearInterval(id)
    }
  }, [refreshFiles, autoRefreshInterval])

  return null
}
