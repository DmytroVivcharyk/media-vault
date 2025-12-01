import { NextResponse } from 'next/server'
import { mediaService } from '@/entities/media/api/mediaService'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const result = await mediaService.generateUploadUrl(body)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate upload URL'
    console.error('Upload endpoint error:', error)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
