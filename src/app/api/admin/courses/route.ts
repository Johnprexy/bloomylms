export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status } = await request.json()
  await sql`UPDATE courses SET status = ${status}::course_status WHERE id = ${id}`
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const myRole = (session.user as any).role as string
  if (myRole !== 'admin' && myRole !== 'super_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const course = await sql`SELECT title FROM courses WHERE id = ${id} LIMIT 1`
  if (!course[0]) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  // Cascade delete everything attached to the course
  await sql`DELETE FROM quiz_attempts WHERE quiz_id IN (SELECT id FROM quizzes WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = ${id}))`
  await sql`DELETE FROM grades WHERE grade_item_id IN (SELECT id FROM grade_items WHERE course_id = ${id})`
  await sql`DELETE FROM grade_items WHERE course_id = ${id}`
  await sql`DELETE FROM lesson_progress WHERE course_id = ${id}`
  try { await sql`DELETE FROM attendance_records WHERE attendance_id IN (SELECT id FROM attendance WHERE course_id = ${id})` } catch (_) {}
  try { await sql`DELETE FROM attendance WHERE course_id = ${id}` } catch (_) {}
  await sql`DELETE FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = ${id}))`
  await sql`DELETE FROM quizzes WHERE lesson_id IN (SELECT id FROM lessons WHERE course_id = ${id})`
  try { await sql`DELETE FROM quizzes WHERE course_id = ${id}` } catch (_) {}
  await sql`DELETE FROM lessons WHERE course_id = ${id}`
  await sql`DELETE FROM modules WHERE course_id = ${id}`
  await sql`DELETE FROM enrollments WHERE course_id = ${id}`
  await sql`DELETE FROM courses WHERE id = ${id}`

  return NextResponse.json({ success: true })
}
