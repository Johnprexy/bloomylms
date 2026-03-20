export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const myRole = (session.user as any).role as string
  const isSuperAdmin = myRole === 'super_admin'
  const isAdmin = myRole === 'admin' || isSuperAdmin

  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, role, is_active } = await request.json()

  // Only super_admin can grant super_admin or admin role
  if (role === 'super_admin' && !isSuperAdmin) return NextResponse.json({ error: 'Only super admins can grant super admin role' }, { status: 403 })
  if (role === 'admin' && !isSuperAdmin) return NextResponse.json({ error: 'Only super admins can grant admin role' }, { status: 403 })

  if (role !== undefined) await sql`UPDATE users SET role = ${role}::user_role WHERE id = ${id}`
  if (is_active !== undefined) await sql`UPDATE users SET is_active = ${is_active} WHERE id = ${id}`

  return NextResponse.json({ success: true })
}
