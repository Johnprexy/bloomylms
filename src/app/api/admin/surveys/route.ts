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
  const id = searchParams.get('id')

  if (id) {
    const questions = await sql`SELECT * FROM survey_questions WHERE survey_id = ${id} ORDER BY position`
    const responses = await sql`SELECT * FROM survey_responses WHERE survey_id = ${id}`
    const total_responses = responses.length
    // Flatten answers for charting
    const answers: any[] = []
    responses.forEach((r: any) => {
      const ans = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers
      Object.entries(ans || {}).forEach(([qid, answer]) => answers.push({ question_id: qid, answer }))
    })
    return NextResponse.json({ questions, total_responses, answers })
  }

  const [surveys, courses] = await Promise.all([
    sql`
      SELECT s.*,
        c.title as course_title,
        (SELECT COUNT(*) FROM survey_questions WHERE survey_id = s.id) as question_count,
        (SELECT COUNT(*) FROM survey_responses WHERE survey_id = s.id) as response_count
      FROM surveys s LEFT JOIN courses c ON s.course_id = c.id
      ORDER BY s.created_at DESC
    `,
    sql`SELECT id, title FROM courses WHERE status = 'published' ORDER BY title`,
  ])
  return NextResponse.json({ surveys, courses })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { title, description, type, course_id, is_anonymous, questions } = await request.json()

  const survey = await sql`
    INSERT INTO surveys (title, description, type, course_id, is_anonymous, created_by)
    VALUES (${title}, ${description || ''}, ${type || 'feedback'}, ${course_id || null}, ${is_anonymous ?? true}, ${userId})
    RETURNING *
  `
  const surveyId = survey[0].id
  if (questions?.length) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      await sql`
        INSERT INTO survey_questions (survey_id, question, type, options, required, position)
        VALUES (${surveyId}, ${q.question}, ${q.type}, ${JSON.stringify(q.options || [])}, ${q.required ?? true}, ${i})
      `
    }
  }
  return NextResponse.json({ data: { ...survey[0], question_count: questions?.length || 0, response_count: 0 } })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, is_active } = await request.json()
  await sql`UPDATE surveys SET is_active = ${is_active} WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
