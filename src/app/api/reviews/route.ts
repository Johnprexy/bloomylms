export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { course_id, rating, comment } = await request.json()
  if (!course_id || !rating) return NextResponse.json({ error: 'course_id and rating required' }, { status: 400 })
  const enroll = await sql`SELECT id FROM enrollments WHERE student_id = ${userId} AND course_id = ${course_id} LIMIT 1`
  if (!enroll[0]) return NextResponse.json({ error: 'Must be enrolled to review' }, { status: 403 })
  await sql`INSERT INTO reviews (course_id, student_id, rating, comment) VALUES (${course_id}, ${userId}, ${rating}, ${comment}) ON CONFLICT (course_id, student_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`
  const all = await sql`SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE course_id = ${course_id}`
  await sql`UPDATE courses SET average_rating = ${Number(all[0].avg).toFixed(1)}, total_reviews = ${Number(all[0].cnt)} WHERE id = ${course_id}`
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  const data = await sql`SELECT r.*, u.full_name, u.avatar_url FROM reviews r JOIN users u ON r.student_id = u.id WHERE r.course_id = ${course_id} ORDER BY r.created_at DESC`
  return NextResponse.json({ data })
}
