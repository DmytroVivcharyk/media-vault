import { NextResponse } from 'next/server'
import { s3 } from '@/shared/lib/S3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function POST(req: Request) {
  try {
    const { key } = await req.json()

    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 })
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
      }),
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete error:', err)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
