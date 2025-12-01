import { NextResponse } from 'next/server'
import { mediaService } from '@/entities/media/api/mediaService'

export async function POST(req: Request) {
  try {
    const { key, keys } = await req.json()

    if (!key && !keys) {
      return NextResponse.json({ error: 'Missing key or keys' }, { status: 400 })
    }

    if (keys && Array.isArray(keys)) {
      // Batch delete
      await mediaService.deleteMultipleFiles(keys)
    } else if (key) {
      // Single delete
      await mediaService.deleteFile(key)
    } else {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete file(s)'
    console.error('Delete endpoint error:', error)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
