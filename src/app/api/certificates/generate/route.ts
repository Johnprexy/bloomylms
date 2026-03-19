export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  const { enrollment_id } = await request.json()
  const enrollments = await sql`SELECT e.*, c.certificate_enabled, c.title as course_title, u.full_name, u.email FROM enrollments e JOIN courses c ON e.course_id = c.id JOIN users u ON e.student_id = u.id WHERE e.id = ${enrollment_id} LIMIT 1`
  const enrollment = enrollments[0]
  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  if (enrollment.status !== 'completed') return NextResponse.json({ error: 'Course not completed' }, { status: 400 })
  if (!enrollment.certificate_enabled) return NextResponse.json({ error: 'No certificate for this course' }, { status: 400 })
  const existing = await sql`SELECT id FROM certificates WHERE enrollment_id = ${enrollment_id} LIMIT 1`
  if (existing[0]) return NextResponse.json({ data: existing[0] })
  const cert = await sql`INSERT INTO certificates (enrollment_id, student_id, course_id, status) VALUES (${enrollment_id}, ${enrollment.student_id}, ${enrollment.course_id}, 'issued') RETURNING *`
  await sql`INSERT INTO notifications (user_id, title, message, type, link) VALUES (${enrollment.student_id}, '🏆 Certificate Issued!', ${'Congratulations! Your certificate for "' + enrollment.course_title + '" is ready.'}, 'success', '/dashboard/certificates')`
  return NextResponse.json({ data: cert[0] })
}
