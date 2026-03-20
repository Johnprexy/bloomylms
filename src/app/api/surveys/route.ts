export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  const surveys = course_id
    ? await sql`SELECT s.*, (SELECT COUNT(*) FROM survey_questions WHERE survey_id = s.id) as q_count FROM surveys s WHERE (s.course_id = ${course_id} OR s.course_id IS NULL) AND s.is_active = true ORDER BY s.created_at DESC`
    : await sql`SELECT s.*, (SELECT COUNT(*) FROM survey_questions WHERE survey_id = s.id) as q_count FROM surveys s WHERE s.course_id IS NULL AND s.is_active = true ORDER BY s.created_at DESC`
  return NextResponse.json({ data: surveys })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { survey_id, answers } = await request.json()
  const survey = await sql`SELECT is_anonymous FROM surveys WHERE id = ${survey_id} LIMIT 1`
  await sql`
    INSERT INTO survey_responses (survey_id, student_id, answers)
    VALUES (${survey_id}, ${survey[0]?.is_anonymous ? null : userId}, ${JSON.stringify(answers)})
  `
  return NextResponse.json({ success: true })
}
