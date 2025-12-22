import { s3 } from '@/shared/lib/S3'
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import type { MediaFile, CreateMediaRequest, MediaListResponse } from '../model/types'

export class MediaService {
  private readonly bucket: string
  private readonly endpoint: string

  constructor() {
    const bucket = process.env.AWS_S3_BUCKET
    const endpoint = process.env.AWS_S3_ENDPOINT

    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable is required')
    }
    if (!endpoint) {
      throw new Error('AWS_S3_ENDPOINT environment variable is required')
    }

    this.bucket = bucket
    this.endpoint = endpoint
  }

  async generateUploadUrl(request: CreateMediaRequest): Promise<{ url: string; key: string }> {
    // Validate input
    if (!request.fileName || !request.fileType) {
      throw new Error('fileName and fileType are required')
    }

    // Generate unique key
    const extension = request.fileName.split('.').pop()
    const key = `uploads/${randomUUID()}.${extension}`

    // Create S3 command
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: request.fileType,
    })

    // Generate presigned URL
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return { url, key }
  }

  async listMedia(): Promise<MediaListResponse> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: 'uploads/',
    })

    const response = await s3.send(command)

    const files: MediaFile[] =
      response.Contents?.map((item) => ({
        key: item.Key!,
        fileName: item.Key!.split('/').pop(),
        url: `${this.endpoint}/${this.bucket}/${item.Key}`,
        lastModified: item.LastModified,
        fileSize: item.Size,
        metadata: {
          mimeType: this.inferMimeType(item.Key!),
        },
      })) ?? []

    return { files }
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    await s3.send(command)
  }

  async deleteMultipleFiles(keys: string[]): Promise<void> {
    // Delete files in parallel
    const deletePromises = keys.map((key) => this.deleteFile(key))
    await Promise.allSettled(deletePromises)
  }

  // Multipart upload methods
  async createMultipartUpload(key: string, contentType: string): Promise<string> {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    })

    const response = await s3.send(command)
    return response.UploadId!
  }

  async generateMultipartUploadUrl(
    key: string,
    uploadId: string,
    partNumber: number,
  ): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    })

    return await getSignedUrl(s3, command, { expiresIn: 3600 })
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>,
  ): Promise<void> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    })

    await s3.send(command)
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    })

    await s3.send(command)
  }

  // Client-side API methods for upload operations
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

  static async completeMultipartUploadRequest(
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

  // Client-side API methods for gallery operations
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

  private inferMimeType(key: string): string {
    const extension = key.split('.').pop()?.toLowerCase()

    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
    }

    return mimeTypes[extension || ''] || 'application/octet-stream'
  }
}

export const mediaService = new MediaService()
