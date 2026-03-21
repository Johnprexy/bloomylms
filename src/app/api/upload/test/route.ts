export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? `✓ Set (${process.env.AWS_ACCESS_KEY_ID.slice(0,4)}***)` : '✗ MISSING',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '✓ Set' : '✗ MISSING',
    AWS_REGION: process.env.AWS_REGION || '✗ MISSING — will default to us-east-1',
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '✗ MISSING',
  })
}
