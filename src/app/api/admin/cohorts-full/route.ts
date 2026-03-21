export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return r === 'admin' || r === 'super_admin' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [courses, rawCohorts, students] = await Promise.all([
    sql`SELECT id, title FROM courses WHERE status != 'archived' ORDER BY title`,
    sql`
      SELECT co.*, c.title as course_title,
        (SELECT COUNT(*) FROM cohort_students cs WHERE cs.cohort_id = co.id) as student_count
      FROM cohorts co JOIN courses c ON co.course_id = c.id ORDER BY co.created_at DESC
    `,
    sql`SELECT id, email, full_name FROM users WHERE role = 'student' AND is_active = true ORDER BY full_name`,
  ])

  // Get students per cohort
  const cohorts = await Promise.all(rawCohorts.map(async (cohort: any) => {
    const cohortStudents = await sql`
      SELECT u.id, u.email, u.full_name FROM cohort_students cs
      JOIN users u ON cs.student_id = u.id WHERE cs.cohort_id = ${cohort.id} ORDER BY u.full_name
    `
    return { ...cohort, students: cohortStudents }
  }))

  return NextResponse.json({ courses, cohorts, students })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, course_id, start_date, end_date, max_students } = await request.json()
  if (!name || !course_id) return NextResponse.json({ error: 'name and course_id required' }, { status: 400 })
  const data = await sql`
    INSERT INTO cohorts (course_id, name, start_date, end_date, max_students, is_open)
    VALUES (${course_id}, ${name}, ${start_date || null}, ${end_date || null}, ${max_students || 50}, true)
    RETURNING *, (SELECT title FROM courses WHERE id = ${course_id}) as course_title
  `
  return NextResponse.json({ data: { ...data[0], students: [], student_count: 0 } })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { cohort_id, student_id, action } = await request.json()
  if (action === 'add') {
    await sql`INSERT INTO cohort_students (cohort_id, student_id) VALUES (${cohort_id}, ${student_id}) ON CONFLICT DO NOTHING`
    // Also ensure enrolled in the cohort's course
    const cohorts = await sql`SELECT course_id FROM cohorts WHERE id = ${cohort_id} LIMIT 1`
    if (cohorts[0]) {
      await sql`INSERT INTO enrollments (student_id, course_id, status) VALUES (${student_id}, ${cohorts[0].course_id}, 'active') ON CONFLICT DO NOTHING`
    }
  } else {
    await sql`DELETE FROM cohort_students WHERE cohort_id = ${cohort_id} AND student_id = ${student_id}`
  }
  return NextResponse.json({ success: true })
}
