import { NextResponse } from 'next/server'
import { s3 } from '@/shared/lib/S3'
import { CompleteMultipartUploadCommand } from '@aws-sdk/client-s3'

export async function POST(req: Request) {
  const { key, uploadId, parts } = await req.json()

  const command = new CompleteMultipartUploadCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts, // [{ ETag, PartNumber }]
    },
  })

  await s3.send(command)

  return NextResponse.json({ success: true })
}
