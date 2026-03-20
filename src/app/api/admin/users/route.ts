export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const myRole = (session.user as any).role as string
  const myId = (session.user as any).id
  const isSuperAdmin = myRole === 'super_admin'
  const isAdmin = myRole === 'admin' || isSuperAdmin

  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, role, is_active } = await request.json()

  // Prevent changing your own role
  if (id === myId) return NextResponse.json({ error: 'You cannot change your own role' }, { status: 403 })

  // Check the target user's current role
  const target = await sql`SELECT role FROM users WHERE id = ${id} LIMIT 1`
  const targetRole = target[0]?.role

  // Only super_admin can grant or revoke admin/super_admin roles
  if ((role === 'super_admin' || role === 'admin') && !isSuperAdmin) {
    return NextResponse.json({ error: 'Only super admins can grant admin roles' }, { status: 403 })
  }

  // Admins cannot demote other admins — only super_admin can
  if ((targetRole === 'admin' || targetRole === 'super_admin') && !isSuperAdmin) {
    return NextResponse.json({ error: 'Only super admins can change admin roles' }, { status: 403 })
  }

  if (role !== undefined) await sql`UPDATE users SET role = ${role}::user_role WHERE id = ${id}`
  if (is_active !== undefined) await sql`UPDATE users SET is_active = ${is_active} WHERE id = ${id}`

  return NextResponse.json({ success: true })
}
