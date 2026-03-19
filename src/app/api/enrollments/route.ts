export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const courses = await sql`SELECT price, status FROM courses WHERE id = ${course_id} LIMIT 1`
  if (!courses[0]) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  if (courses[0].status !== 'published') return NextResponse.json({ error: 'Course not available' }, { status: 400 })
  if (courses[0].price > 0) return NextResponse.json({ error: 'This course requires payment' }, { status: 400 })

  const existing = await sql`SELECT id FROM enrollments WHERE student_id = ${userId} AND course_id = ${course_id} LIMIT 1`
  if (existing[0]) return NextResponse.json({ data: { enrollment_id: existing[0].id } })

  const enrollment = await sql`
    INSERT INTO enrollments (student_id, course_id, status)
    VALUES (${userId}, ${course_id}, 'active') RETURNING id
  `

  await sql`UPDATE courses SET total_students = total_students + 1 WHERE id = ${course_id}`

  await sql`
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (${userId}, '🎉 Enrolled Successfully!', 'You have been enrolled. Start learning now!', 'success', '/dashboard')
  `

  return NextResponse.json({ data: { enrollment_id: enrollment[0].id } })
}
