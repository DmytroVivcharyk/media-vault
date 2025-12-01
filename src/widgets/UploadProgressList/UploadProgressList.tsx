'use client'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { uploadManager } from '@/features/upload/model/uploadManager'
import type { UploadFile } from '@/features/upload/model/types'

export function UploadProgressList() {
  const [uploads, setUploads] = useState<UploadFile[]>(uploadManager.state)

  useEffect(() => {
    const unsub = uploadManager.subscribe(() => {
      setUploads([...uploadManager.state])
    })
    return () => unsub()
  }, [])

  if (uploads.filter((u) => u.status !== 'success').length === 0) return null

  return (
    <div className="space-y-3 mt-4">
      {uploads.filter((u) => u.status !== 'success').map((u, idx) => (
        <div key={idx} className="flex items-center gap-4">
          <img
            src={u.previewUrl}
            alt=""
            className="w-16 h-16 object-cover rounded-lg border"
          />

          <div className="flex-1">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${u.progress}%` }}
              ></div>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {u.status === 'uploading' && `${u.progress}%`}
              {u.status === 'pending' && 'Waiting…'}
              {u.status === 'success' && 'Complete'}
              {u.status === 'error' && 'Error'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
