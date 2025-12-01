export type MediaFileStatus = 'pending' | 'uploading' | 'success' | 'error'

export type MediaFileType = 'image' | 'video' | 'document'

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

// Discriminated unions for state management
export type UploadAction =
  | { type: 'ADD_FILES'; files: File[] }
  | { type: 'UPDATE_PROGRESS'; fileId: string; progress: number }
  | { type: 'SET_STATUS'; fileId: string; status: MediaFileStatus; error?: string }
  | { type: 'REMOVE_FILE'; fileId: string }
  | { type: 'CLEAR_COMPLETED' }

export interface UploadState {
  readonly files: UploadFile[]
  readonly isUploading: boolean
  readonly progress: Record<string, number>
  readonly errors: Record<string, string>
}

export interface MediaGalleryState {
  readonly files: MediaFile[]
  readonly loading: boolean
  readonly error: string | null
  readonly selectedFiles: string[]
  readonly view: 'grid' | 'list'
  readonly sortBy: 'name' | 'date' | 'size'
  readonly sortOrder: 'asc' | 'desc'
}
