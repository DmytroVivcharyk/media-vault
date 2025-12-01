import { S3Client } from '@aws-sdk/client-s3'

const isMinio = !!process.env.AWS_S3_ENDPOINT

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_S3_ENDPOINT,
  forcePathStyle: isMinio,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})
