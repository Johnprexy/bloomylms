export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const session_id = searchParams.get('session_id')
  const cohort_id = searchParams.get('cohort_id')
  const course_id = searchParams.get('course_id')

  // Load attendance records for a session
  if (session_id) {
    const sess = await sql`SELECT * FROM attendance WHERE id = ${session_id} LIMIT 1`
    const students = await sql`
      SELECT u.id, u.email, u.full_name
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ${sess[0]?.course_id}
      AND u.is_active = true
      AND u.role = 'student'
      ORDER BY u.full_name
    `
    const records = await sql`SELECT * FROM attendance_records WHERE attendance_id = ${session_id}`
    return NextResponse.json({ session: sess[0], students, records })
  }

  // Load cohorts with their courses
  const cohorts = await sql`
    SELECT co.id, co.name, co.start_date, co.end_date,
      c.id as course_id, c.title as course_title,
      (SELECT COUNT(*) FROM cohort_students cs WHERE cs.cohort_id = co.id) as student_count
    FROM cohorts co
    JOIN courses c ON co.course_id = c.id
    ORDER BY co.created_at DESC
  `

  // Load sessions filtered by cohort/course
  let sessions: any[] = []
  if (cohort_id && course_id) {
    sessions = await sql`
      SELECT a.*, c.title as course_title, co.name as cohort_name
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN cohorts co ON a.cohort_id = co.id
      WHERE a.cohort_id = ${cohort_id} AND a.course_id = ${course_id}
      ORDER BY a.session_date DESC, a.created_at DESC
    `
  } else if (cohort_id) {
    sessions = await sql`
      SELECT a.*, c.title as course_title, co.name as cohort_name
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN cohorts co ON a.cohort_id = co.id
      WHERE a.cohort_id = ${cohort_id}
      ORDER BY a.session_date DESC
    `
  } else {
    sessions = await sql`
      SELECT a.*, c.title as course_title, co.name as cohort_name
      FROM attendance a
      JOIN courses c ON a.course_id = c.id
      LEFT JOIN cohorts co ON a.cohort_id = co.id
      ORDER BY a.session_date DESC, a.created_at DESC
      LIMIT 50
    `
  }

  return NextResponse.json({ cohorts, sessions })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { course_id, cohort_id, title, session_date } = await request.json()
  if (!course_id || !session_date) return NextResponse.json({ error: 'course_id and session_date required' }, { status: 400 })

  const data = await sql`
    INSERT INTO attendance (course_id, cohort_id, title, session_date, created_by)
    VALUES (${course_id}, ${cohort_id || null}, ${title || null}, ${session_date}, ${userId})
    RETURNING *
  `

  // Auto-create grade item for attendance
  try {
    const existing = await sql`
      SELECT id FROM grade_items
      WHERE source_type = 'attendance' AND source_id = ${data[0].id}
      LIMIT 1
    `
    if (!existing[0]) {
      await sql`
        INSERT INTO grade_items (course_id, title, category, max_score, weight_percent, source_type, source_id, position)
        SELECT ${course_id}, ${title || ('Attendance - ' + session_date)}, 'attendance', 100, 0,
          'attendance', ${data[0].id},
          COALESCE((SELECT MAX(position) + 1 FROM grade_items WHERE course_id = ${course_id}), 0)
      `
    }
  } catch (e) { console.error('Auto-grade-item failed:', e) }

  return NextResponse.json({ data: data[0] })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { session_id, records } = await request.json()
  if (!session_id || !records) return NextResponse.json({ error: 'session_id and records required' }, { status: 400 })

  // Get grade item for this attendance session
  const gradeItem = await sql`
    SELECT gi.id, gi.max_score FROM grade_items gi
    WHERE gi.source_type = 'attendance' AND gi.source_id = ${session_id}
    LIMIT 1
  `

  for (const [student_id, status] of Object.entries(records as Record<string, string>)) {
    await sql`
      INSERT INTO attendance_records (attendance_id, student_id, status)
      VALUES (${session_id}, ${student_id}, ${status})
      ON CONFLICT (attendance_id, student_id) DO UPDATE SET status = EXCLUDED.status, marked_at = NOW()
    `
    // Auto-post to gradebook: present=100, late=75, excused=100, absent=0
    if (gradeItem[0]) {
      const scoreMap: Record<string, number> = { present: 100, late: 75, excused: 100, absent: 0 }
      const score = ((scoreMap[status] || 0) / 100) * Number(gradeItem[0].max_score)
      await sql`
        INSERT INTO grades (grade_item_id, student_id, score, graded_at)
        VALUES (${gradeItem[0].id}, ${student_id}, ${score}, NOW())
        ON CONFLICT (grade_item_id, student_id) DO UPDATE SET score = EXCLUDED.score, graded_at = NOW()
      `
    }
  }
  return NextResponse.json({ success: true })
}
