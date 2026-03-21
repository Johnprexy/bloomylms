export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const ALLOWED_EXTENSIONS = [
  'pdf','doc','docx','ppt','pptx','xls','xlsx',
  'zip','rar','txt','png','jpg','jpeg','gif','webp','mp4','mp3'
]
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

function getS3Client() {
  const region = process.env.AWS_REGION || 'us-east-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) return null

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bucket = process.env.AWS_S3_BUCKET
  const s3 = getS3Client()

  if (!s3 || !bucket) {
    return NextResponse.json({
      error: 'File storage not configured. Use the "Paste URL" tab to paste a Google Drive or Dropbox link.',
      fallback: true,
    }, { status: 503 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large. Maximum 50MB.' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `File type .${ext} is not allowed.` }, { status: 400 })
    }

    // Build S3 key
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
    const key = `lms-uploads/${Date.now()}-${safeName}`

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ContentDisposition: `inline; filename="${file.name}"`,
    }))

    // Build public URL
    const region = process.env.AWS_REGION || 'us-east-1'
    const customDomain = process.env.AWS_S3_CUSTOM_DOMAIN // optional CloudFront
    const url = customDomain
      ? `https://${customDomain}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`

    return NextResponse.json({ url, name: file.name, size: file.size, key })
  } catch (err: any) {
    console.error('S3 upload error:', err)
    const msg = err.message || 'Upload failed'
    if (msg.includes('credential') || msg.includes('Access Denied') || msg.includes('403')) {
      return NextResponse.json({ error: 'S3 credentials invalid or bucket policy blocks uploads. Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and bucket permissions.', fallback: true }, { status: 503 })
    }
    return NextResponse.json({ error: msg, fallback: true }, { status: 500 })
  }
}
