import { NextResponse } from 'next/server'
import { s3 } from '@/shared/lib/S3'
import { UploadPartCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function POST(req: Request) {
  const { key, uploadId, partNumber } = await req.json()

  const command = new UploadPartCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  })

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })

  return NextResponse.json({ url })
}
