export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const users = await sql`SELECT id, email, full_name, avatar_url, role, phone, bio, location, linkedin_url, github_url, created_at FROM users WHERE id = ${userId} LIMIT 1`
  return NextResponse.json({ data: users[0] })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { full_name, phone, bio, location, linkedin_url, github_url } = await request.json()
  await sql`UPDATE users SET full_name = ${full_name}, phone = ${phone}, bio = ${bio}, location = ${location}, linkedin_url = ${linkedin_url}, github_url = ${github_url}, updated_at = NOW() WHERE id = ${userId}`
  return NextResponse.json({ success: true })
}
