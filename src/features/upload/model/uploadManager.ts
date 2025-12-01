import { validateImageFile } from './validators'
import type { UploadFile, PresignedResponse } from './types'

export class UploadManager {
  uploads: UploadFile[] = []
  listeners: Set<() => void> = new Set()

  /** Subscribe UI components to state changes */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  

  private notify() {
    for (const l of this.listeners) l()
  }

  /** Public getter for React components */
  get state() {
    return this.uploads
  }

  /** Add files to the upload queue with optimistic preview */
  addFiles(files: File[]) {
    for (const file of files) {
      const error = validateImageFile(file)
      if (error) {
        console.error(error)
        continue
      }

      const previewUrl = URL.createObjectURL(file)

      this.uploads.push({
        file,
        previewUrl,
        progress: 0,
        status: 'pending',
      })
    }

    this.notify()
  }

  /** Trigger uploads for all pending files */
  async uploadAll() {
    const pending = this.uploads.filter((u) => u.status === 'pending')

    await Promise.all(pending.map((u) => this.uploadSingle(u)))
  }

  /** Upload one file with progress tracking (XHR) */
  private async uploadSingle(upload: UploadFile) {
    upload.status = 'uploading'
    this.notify()

    try {
      // 1. Request presigned URL
      const presigned = await this.getPresignedUrl(upload.file)

      // 2. Perform XHR upload
      await this.uploadViaXHR(upload, presigned)

      // 3. Mark success
      upload.status = 'success'
      upload.key = presigned.key
      upload.progress = 100
    } catch (err) {
      console.error('Upload failed:', err)
      upload.status = 'error'
    }

    this.notify()
  }

  /** Call our /api/upload endpoint */
  private async getPresignedUrl(file: File): Promise<PresignedResponse> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) throw new Error('Failed to get presigned URL')

    return res.json()
  }

  /** Upload using XMLHttpRequest to get progress updates */
  private uploadViaXHR(upload: UploadFile, presigned: PresignedResponse) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          upload.progress = Number(((e.loaded / e.total) * 100).toFixed(0))
          this.notify()
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`Upload failed: ${xhr.statusText}`))
      }

      xhr.onerror = () => reject(new Error('Network error during upload'))

      xhr.open('PUT', presigned.url)
      xhr.setRequestHeader('Content-Type', upload.file.type)
      xhr.send(upload.file)
    })
  }
}

// Singleton instance
export const uploadManager = new UploadManager()
