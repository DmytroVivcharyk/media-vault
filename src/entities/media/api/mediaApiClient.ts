import type { MediaFile } from '../model/types'

export class MediaApiClient {
  // Upload operations
  static async getUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
  ): Promise<{ url: string; key: string }> {
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        fileType,
        fileSize,
      }),
    })

    if (!response.ok) throw new Error('Failed to get upload URL')
    return response.json()
  }

  static async startMultipartUpload(
    fileName: string,
    fileType: string,
  ): Promise<{ uploadId: string; key: string }> {
    const response = await fetch('/api/upload/multipart/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        fileType,
      }),
    })

    if (!response.ok) throw new Error('Failed to start multipart upload')
    return response.json()
  }

  static async getMultipartUploadUrl(
    key: string,
    uploadId: string,
    partNumber: number,
  ): Promise<{ url: string }> {
    const response = await fetch('/api/upload/multipart/sign-part', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        uploadId,
        partNumber,
      }),
    })

    if (!response.ok) throw new Error('Failed to get multipart upload URL')
    return response.json()
  }

  static async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>,
  ): Promise<void> {
    const response = await fetch('/api/upload/multipart/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        uploadId,
        parts,
      }),
    })

    if (!response.ok) throw new Error('Failed to complete multipart upload')
  }

  // Gallery operations
  static async fetchMediaFiles(): Promise<MediaFile[]> {
    const response = await fetch('/api/media')
    if (!response.ok) throw new Error('Failed to fetch media files')
    return response.json()
  }

  static async deleteMediaFile(key: string): Promise<void> {
    const response = await fetch('/api/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })

    if (!response.ok) throw new Error('Failed to delete file')
  }
}
