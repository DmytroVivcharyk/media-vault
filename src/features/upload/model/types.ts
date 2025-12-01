export interface UploadFile {
  file: File
  previewUrl: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  key?: string
}

export interface PresignedResponse {
  url: string
  key: string
}
