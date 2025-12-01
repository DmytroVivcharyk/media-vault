import { NextResponse } from 'next/server'
import { mediaService } from '@/entities/media/api/mediaService'

export async function GET() {
  try {
    const result = await mediaService.listMedia()
    return NextResponse.json(result.files)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list media files'
    console.error('Media list endpoint error:', error)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
