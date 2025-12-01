import { NextResponse } from 'next/server'
import { s3 } from '@/shared/lib/S3'
import { ListObjectsV2Command } from '@aws-sdk/client-s3'

export async function GET() {
  try {
    const bucket = process.env.AWS_S3_BUCKET!

    const data = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'uploads/',
      }),
    )

    const files =
      data.Contents?.map((obj) => ({
        key: obj.Key!,
        url: `${process.env.AWS_S3_ENDPOINT}/${bucket}/${obj.Key}`,
      })) ?? []

    return NextResponse.json(files)
  } catch (err) {
    console.error('List error:', err)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}
