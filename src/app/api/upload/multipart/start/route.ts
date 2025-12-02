import { NextResponse } from 'next/server'
import { mediaService } from '@/entities/media/api/mediaService'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const { fileName, fileType } = await req.json()

  const extension = fileName.split('.').pop()
  const key = `uploads/${randomUUID()}.${extension}`

  const uploadId = await mediaService.createMultipartUpload(key, fileType)

  return NextResponse.json({
    uploadId,
    key,
  })
}
