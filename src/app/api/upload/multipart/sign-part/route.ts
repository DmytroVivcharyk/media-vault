import { NextResponse } from 'next/server'
import { mediaService } from '@/entities/media/api/mediaService'

export async function POST(req: Request) {
  const { key, uploadId, partNumber } = await req.json()

  const url = await mediaService.generateMultipartUploadUrl(key, uploadId, partNumber)

  return NextResponse.json({ url })
}
