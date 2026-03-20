export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return r === 'admin' || r === 'super_admin' }

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const myRole = (session.user as any).role as string
  const myId = (session.user as any).id
  if (!isAdmin(myRole)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, role, is_active } = await request.json()
  if (id === myId) return NextResponse.json({ error: 'You cannot change your own account' }, { status: 403 })

  const target = await sql`SELECT role FROM users WHERE id = ${id} LIMIT 1`
  const targetRole = target[0]?.role

  if ((role === 'super_admin' || role === 'admin') && myRole !== 'super_admin')
    return NextResponse.json({ error: 'Only super admins can grant admin roles' }, { status: 403 })
  if ((targetRole === 'admin' || targetRole === 'super_admin') && myRole !== 'super_admin')
    return NextResponse.json({ error: 'Only super admins can change admin roles' }, { status: 403 })

  if (role !== undefined) await sql`UPDATE users SET role = ${role}::user_role WHERE id = ${id}`
  if (is_active !== undefined) await sql`UPDATE users SET is_active = ${is_active} WHERE id = ${id}`
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const myRole = (session.user as any).role as string
  const myId = (session.user as any).id
  if (!isAdmin(myRole)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  if (id === myId) return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 403 })

  const target = await sql`SELECT role, full_name FROM users WHERE id = ${id} LIMIT 1`
  if (!target[0]) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if ((target[0].role === 'admin' || target[0].role === 'super_admin') && myRole !== 'super_admin')
    return NextResponse.json({ error: 'Only super admins can delete admin accounts' }, { status: 403 })

  // Cascade delete all user data
  await sql`DELETE FROM quiz_attempts WHERE student_id = ${id}`
  await sql`DELETE FROM lesson_progress WHERE student_id = ${id}`
  await sql`DELETE FROM grades WHERE student_id = ${id}`
  await sql`DELETE FROM attendance_records WHERE student_id = ${id}`
  await sql`DELETE FROM enrollments WHERE student_id = ${id}`
  try { await sql`DELETE FROM cohort_students WHERE student_id = ${id}` } catch (_) {}
  await sql`DELETE FROM notifications WHERE user_id = ${id}`
  await sql`DELETE FROM users WHERE id = ${id}`

  return NextResponse.json({ success: true })
}
