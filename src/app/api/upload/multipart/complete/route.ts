import { NextResponse } from 'next/server'
import { mediaService } from '@/entities/media/api/mediaService'

export async function POST(req: Request) {
  const { key, uploadId, parts } = await req.json()

  await mediaService.completeMultipartUpload(key, uploadId, parts)

  return NextResponse.json({ success: true })
}
