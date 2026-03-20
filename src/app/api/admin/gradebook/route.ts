export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin', 'super_admin', 'instructor'].includes(r) }

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  if (!course_id) {
    const courses = await sql`SELECT id, title FROM courses WHERE status = 'published' ORDER BY title`
    return NextResponse.json({ courses })
  }
  const [items, students, grades] = await Promise.all([
    sql`SELECT * FROM grade_items WHERE course_id = ${course_id} ORDER BY position, created_at`,
    sql`SELECT u.id, u.email, u.full_name FROM enrollments e JOIN users u ON e.student_id = u.id WHERE e.course_id = ${course_id} AND u.is_active = true ORDER BY u.full_name`,
    sql`SELECT g.* FROM grades g JOIN grade_items gi ON g.grade_item_id = gi.id WHERE gi.course_id = ${course_id}`,
  ])
  return NextResponse.json({ items, students, grades })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { course_id, title, category, max_score, weight_percent, due_date } = await request.json()
  const data = await sql`
    INSERT INTO grade_items (course_id, title, category, max_score, weight_percent, due_date)
    VALUES (${course_id}, ${title}, ${category}, ${max_score || 100}, ${weight_percent || 0}, ${due_date || null})
    RETURNING *
  `
  return NextResponse.json({ data: data[0] })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { grades } = await request.json()
  for (const g of grades) {
    await sql`
      INSERT INTO grades (grade_item_id, student_id, score, graded_by, graded_at)
      VALUES (${g.grade_item_id}, ${g.student_id}, ${g.score}, ${userId}, NOW())
      ON CONFLICT (grade_item_id, student_id) DO UPDATE SET score = EXCLUDED.score, graded_by = EXCLUDED.graded_by, graded_at = NOW()
    `
  }
  return NextResponse.json({ success: true })
}
