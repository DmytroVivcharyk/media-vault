import { MediaApiClient } from '../api/mediaApiClient'
import type { Action } from './types'
export function createMediaFileActions(dispatch: React.Dispatch<Action>) {
  const refresh = async () => {
    dispatch({ type: 'LOAD_START' })
    try {
      const files = await MediaApiClient.fetchMediaFiles()
      dispatch({ type: 'LOAD_SUCCESS', files })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load files'
      dispatch({ type: 'LOAD_ERROR', error: msg })
    }
  }

  const remove = async (fileKey: string) => {
    dispatch({ type: 'REMOVE_OPTIMISTIC', fileKey })

    try {
      await MediaApiClient.deleteMediaFile(fileKey)
    } catch (e) {
      await refresh()
      throw e
    }
  }

  const invalidate = () => {
    dispatch({ type: 'INVALIDATE' })
  }

  return { refresh, remove, invalidate }
}
