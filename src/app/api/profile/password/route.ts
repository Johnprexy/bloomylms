export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const { current_password, new_password } = await request.json()
  if (!new_password || new_password.length < 6)
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })

  const user = await sql`SELECT password_hash FROM users WHERE id = ${userId} LIMIT 1`
  if (!user[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verify current password
  const valid = await bcrypt.compare(current_password || '', user[0].password_hash || '')
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  const hash = await bcrypt.hash(new_password, 10)
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`
  return NextResponse.json({ success: true })
}
