export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return r === 'admin' || r === 'super_admin' || r === 'instructor' }

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const session_id = searchParams.get('session_id')

  if (session_id) {
    const att = await sql`SELECT * FROM attendance WHERE id = ${session_id} LIMIT 1`
    const students = await sql`
      SELECT u.id, u.email, u.full_name FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ${att[0]?.course_id} AND u.is_active = true ORDER BY u.full_name
    `
    const records = await sql`SELECT * FROM attendance_records WHERE attendance_id = ${session_id}`
    return NextResponse.json({ students, records })
  }

  const [courses, sessions] = await Promise.all([
    sql`SELECT id, title FROM courses WHERE status = 'published' ORDER BY title`,
    sql`SELECT a.*, c.title as course_title FROM attendance a JOIN courses c ON a.course_id = c.id ORDER BY a.session_date DESC, a.created_at DESC LIMIT 50`,
  ])
  return NextResponse.json({ courses, sessions })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { course_id, title, session_date, cohort_id } = await request.json()
  const data = await sql`
    INSERT INTO attendance (course_id, cohort_id, session_title, session_date, created_by)
    VALUES (${course_id}, ${cohort_id || null}, ${title}, ${session_date}, ${userId})
    RETURNING *, ${title} as title, (SELECT title FROM courses WHERE id = ${course_id}) as course_title
  `
  return NextResponse.json({ data: data[0] })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { session_id, records } = await request.json()
  for (const [student_id, status] of Object.entries(records)) {
    await sql`
      INSERT INTO attendance_records (attendance_id, student_id, status)
      VALUES (${session_id}, ${student_id}, ${status as string})
      ON CONFLICT (attendance_id, student_id) DO UPDATE SET status = EXCLUDED.status
    `
  }
  return NextResponse.json({ success: true })
}
