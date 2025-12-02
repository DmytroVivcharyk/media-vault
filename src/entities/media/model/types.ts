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
