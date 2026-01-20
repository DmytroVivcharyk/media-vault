export type MediaFileStatus = 'pending' | 'uploading' | 'success' | 'error'

export interface MediaFile {
  readonly key: string
  readonly fileName?: string
  readonly fileType?: string
  readonly fileSize?: number
  readonly url: string
  readonly thumbnailUrl?: string
  readonly lastModified?: Date
  readonly metadata?: MediaMetadata
}

export interface MediaMetadata {
  readonly width?: number
  readonly height?: number
  readonly duration?: number // for videos
  readonly mimeType?: string
  readonly checksum?: string
}

export interface UploadFile {
  readonly id: string
  readonly file: File
  readonly previewUrl: string
  readonly progress: number
  readonly status: MediaFileStatus
  readonly error?: string
  readonly key?: string
}

export interface CreateMediaRequest {
  readonly fileName: string
  readonly fileType: string
  readonly fileSize?: number
}

export interface MediaListResponse {
  readonly files: MediaFile[]
  readonly totalCount?: number
  readonly hasMore?: boolean
  readonly nextToken?: string
}

export type ListState =
  | { status: 'idle' }
  | { status: 'loading'; data?: MediaFile[] }
  | { status: 'ready'; data: MediaFile[] }
  | { status: 'error'; error: string; data?: MediaFile[] }

export type MediaFilesStore = {
  list: ListState
  load: () => Promise<void>
  refresh: () => Promise<void>
  remove: (fileKey: string) => Promise<void>
  invalidate: () => void
}

export type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; files: MediaFile[] }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'REMOVE_OPTIMISTIC'; fileKey: string }
  | { type: 'INVALIDATE' }
