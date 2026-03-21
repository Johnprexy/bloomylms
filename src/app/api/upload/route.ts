export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const ALLOWED_EXTENSIONS = [
  'pdf','doc','docx','ppt','pptx','xls','xlsx',
  'zip','rar','txt','png','jpg','jpeg','gif','webp','mp4','mp3'
]

const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check token exists first
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({
      error: 'File storage not configured. Please set up Vercel Blob storage first, or use the "Paste URL" tab to paste a Google Drive / Dropbox link instead.'
    }, { status: 503 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: `File type .${ext} not allowed.` }, { status: 400 })
    }

    const { put } = await import('@vercel/blob')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
    const blob = await put(`lms/${Date.now()}-${safeName}`, file, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url, name: file.name, size: file.size })
  } catch (err: any) {
    console.error('Upload error:', err)
    // Blob token invalid or not set
    if (err.message?.includes('token') || err.message?.includes('unauthorized') || err.status === 401) {
      return NextResponse.json({
        error: 'Storage token invalid. Use "Paste URL" tab to paste a Google Drive or Dropbox share link instead.'
      }, { status: 503 })
    }
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 })
  }
}
