export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, role, is_active } = await request.json()
  if (role) await sql`UPDATE users SET role = ${role}::user_role WHERE id = ${id}`
  if (is_active !== undefined) await sql`UPDATE users SET is_active = ${is_active} WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
