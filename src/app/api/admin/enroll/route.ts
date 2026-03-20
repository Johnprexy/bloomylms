export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(role: string) { return role === 'admin' || role === 'super_admin' }

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  const search = searchParams.get('search') || ''
  const filter = searchParams.get('filter') || 'all'

  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const users = await sql`
    SELECT u.id, u.email, u.full_name, u.role, u.is_active,
      EXISTS(SELECT 1 FROM enrollments e WHERE e.student_id = u.id AND e.course_id = ${course_id}) as enrolled
    FROM users u
    WHERE u.role IN ('student', 'instructor')
      AND u.is_active = true
      AND (${search} = '' OR u.full_name ILIKE ${'%'+search+'%'} OR u.email ILIKE ${'%'+search+'%'})
    ORDER BY u.full_name ASC
  `

  const filtered = filter === 'enrolled'
    ? users.filter((u: any) => u.enrolled)
    : filter === 'not_enrolled'
    ? users.filter((u: any) => !u.enrolled)
    : users

  return NextResponse.json({ data: filtered })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { course_id, user_ids } = await request.json()
  if (!course_id || !user_ids?.length) return NextResponse.json({ error: 'course_id and user_ids required' }, { status: 400 })

  let enrolled = 0, skipped = 0

  for (const userId of user_ids) {
    const existing = await sql`SELECT id FROM enrollments WHERE student_id = ${userId} AND course_id = ${course_id} LIMIT 1`
    if (existing[0]) { skipped++; continue }
    await sql`INSERT INTO enrollments (student_id, course_id, status) VALUES (${userId}, ${course_id}, 'active')`
    await sql`INSERT INTO notifications (user_id, title, message, type, link) VALUES (${userId}, '🎉 You have been enrolled!', 'An admin has enrolled you in a new course. Start learning now!', 'success', '/dashboard')`
    enrolled++
  }

  await sql`UPDATE courses SET total_students = (SELECT COUNT(*) FROM enrollments WHERE course_id = ${course_id}) WHERE id = ${course_id}`

  return NextResponse.json({ data: { enrolled, skipped } })
}
