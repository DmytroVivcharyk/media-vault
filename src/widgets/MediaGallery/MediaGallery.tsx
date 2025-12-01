'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { MediaFile } from '@/shared/types/media'

export function MediaGallery() {
  const [files, setFiles] = useState<MediaFile[]>([])

  useEffect(() => {
    let active = true
  
    const fetchFiles = async () => {
      const res = await fetch('/api/media')
      if (!active) return
      if (res.ok) {
        setFiles(await res.json())
      }
    }
  
    fetchFiles()
  
    const interval = setInterval(fetchFiles, 2000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])
  

  return (
    <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {files.map((file) => (
        <div key={file.key} className="relative">
          <img
            src={file.url}
            alt=""
            width={400}
            height={160}
            className="w-full h-40 object-cover rounded-lg"
          />
        </div>
      ))}
    </div>
  )
}
