import { useContext } from 'react'
import { UploadContext } from './UploadProvider'

export const useUpload = () => {
  const ctx = useContext(UploadContext)

  if (!ctx) {
    throw new Error('useUploadViewModel must be used within UploadProvider')
  }
  return ctx
}
