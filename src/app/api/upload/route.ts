import { NextResponse } from 'next/server'
import { s3 } from '@/shared/lib/S3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  try {
    const { fileName, fileType } = await req.json()

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 })
    }

    const bucket = process.env.AWS_S3_BUCKET!
    const extension = fileName.split('.').pop()
    const key = `uploads/${randomUUID()}.${extension}`

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    })

    // Generate presigned PUT URL
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

    return NextResponse.json({
      url,
      key,
    })
  } catch (err) {
    console.error('Upload URL error:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
