import { useContext } from 'react'
import { MediaGalleryContext } from './MediaGalleryProvider'

export function useMediaGallery() {
  const ctx = useContext(MediaGalleryContext)
  if (!ctx) throw new Error('useMediaGallery must be used within MediaGalleryProvider')
  return ctx
}
