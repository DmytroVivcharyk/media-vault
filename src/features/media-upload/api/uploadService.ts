import { MediaService } from '@/entities/media/api/mediaService'

const CHUNK_SIZE = 8 * 1024 * 1024 // 8MB

type UploadProgressCallback = (progress: number) => void

interface UploadOptions {
  onProgress?: UploadProgressCallback
}

export class UploadService {
  async uploadFile(file: File, options?: UploadOptions): Promise<void> {
    // Large files → multipart
    if (file.size > 50 * 1024 * 1024) {
      return this.multipartUpload(file, options)
    }

    // Otherwise: simple upload
    return this.simpleUpload(file, options)
  }

  private async simpleUpload(file: File, options?: UploadOptions): Promise<void> {
    const { url } = await MediaService.getUploadUrl(file.name, file.type, file.size)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options?.onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          options.onProgress(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          if (options?.onProgress) options.onProgress(100)
          resolve()
        } else {
          reject(new Error('Upload failed'))
        }
      }

      xhr.onerror = () => {
        reject(new Error('Upload failed'))
      }

      xhr.open('PUT', url)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  }

  private async multipartUpload(file: File, options?: UploadOptions): Promise<void> {
    // 1. Start multipart upload
    const { uploadId, key } = await MediaService.startMultipartUpload(file.name, file.type)

    // 2. Chunk the file
    const chunks = Math.ceil(file.size / CHUNK_SIZE)

    const uploadedParts: { ETag: string; PartNumber: number }[] = []

    for (let partNumber = 1; partNumber <= chunks; partNumber++) {
      const start = (partNumber - 1) * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      // 3. Request presigned URL for this part
      const { url } = await MediaService.getMultipartUploadUrl(key, uploadId, partNumber)

      // 4. Upload part
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options?.onProgress) {
          const totalUploaded = start + event.loaded
          const progress = Math.round((totalUploaded / file.size) * 100)
          options.onProgress(progress)
        }
      }

      const partETag = await new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          const ETag = xhr.getResponseHeader('ETag')
          if (ETag) resolve(ETag.replace(/"/g, ''))
          else reject(new Error('Missing ETag'))
        }

        xhr.onerror = () => reject(new Error('Chunk upload failed'))

        xhr.open('PUT', url)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.send(chunk)
      })

      uploadedParts.push({ ETag: partETag, PartNumber: partNumber })
    }

    // 5. Complete multipart upload
    await MediaService.completeMultipartUploadRequest(key, uploadId, uploadedParts)

    if (options?.onProgress) options.onProgress(100)
  }
}

export const uploadService = new UploadService()
