import { NextResponse } from 'next/server'
import { s3 } from '@/shared/lib/S3'
import { CreateMultipartUploadCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const { fileName, fileType } = await req.json()

  const bucket = process.env.AWS_S3_BUCKET!
  const extension = fileName.split('.').pop()
  const key = `uploads/${randomUUID()}.${extension}`

  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: fileType,
  })

  const response = await s3.send(command)

  return NextResponse.json({
    uploadId: response.UploadId,
    key,
  })
}
