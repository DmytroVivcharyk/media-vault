import { useContext } from 'react'
import { Ctx } from './mediaFilesStore'

export function useMediaFiles() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMediaFiles must be used within MediaFilesProvider')
  return ctx
}
