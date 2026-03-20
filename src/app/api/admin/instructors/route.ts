export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isAdmin } from '@/lib/permissions'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { full_name, email, password, phone, bio, location } = await req.json()
  if (!full_name || !email || !password) return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const existing = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
  if (existing[0]) return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 })

  const hash = bcrypt.hashSync(password, 10)
  const user = await sql`
    INSERT INTO users (email, full_name, password_hash, role, phone, bio, location, is_active, email_verified)
    VALUES (${email.toLowerCase()}, ${full_name}, ${hash}, 'instructor', ${phone || null}, ${bio || null}, ${location || null}, true, true)
    RETURNING id, email, full_name, role`
  return NextResponse.json({ success: true, data: user[0] })
}
