export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'super_admin')
    return NextResponse.json({ error: 'Only super admins can create admin accounts' }, { status: 403 })

  const { full_name, email, role, phone, password: customPassword } = await request.json()
  if (!full_name?.trim() || !email?.trim() || !role)
    return NextResponse.json({ error: 'Name, email and role are required' }, { status: 400 })

  const validRoles = ['admin', 'super_admin', 'instructor']
  if (!validRoles.includes(role))
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  // Check email already exists
  const existing = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
  if (existing[0]) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })

  // Generate or use provided password
  const password = customPassword?.trim() || crypto.randomBytes(5).toString('hex').toUpperCase()
  const hash = await bcrypt.hash(password, 10)

  const user = await sql`
    INSERT INTO users (email, full_name, phone, password_hash, role, is_active, email_verified)
    VALUES (${email.toLowerCase().trim()}, ${full_name.trim()}, ${phone || null}, ${hash}, ${role}, true, true)
    RETURNING id, email, full_name, role, phone, created_at
  `

  return NextResponse.json({ data: { ...user[0], temp_password: password } })
}
