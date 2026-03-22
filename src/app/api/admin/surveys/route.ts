export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }

// Safely add cohort_id column if it doesn't exist
async function ensureCohortColumn() {
  try {
    await sql`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL`
    await sql`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id) ON DELETE SET NULL`
    await sql`ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS student_name TEXT`
    await sql`ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS student_email TEXT`
  } catch (_) {}
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const questions = await sql`SELECT * FROM survey_questions WHERE survey_id = ${id} ORDER BY position`
    
    // Get responses with student info
    const responses = await sql`
      SELECT sr.*, u.full_name as student_name, u.email as student_email
      FROM survey_responses sr
      LEFT JOIN users u ON sr.student_id = u.id
      WHERE sr.survey_id = ${id}
      ORDER BY sr.submitted_at DESC
    `
    const total_responses = responses.length

    // Flatten answers keyed by question_id
    const answers: any[] = []
    responses.forEach((r: any) => {
      const ans = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers
      Object.entries(ans || {}).forEach(([qid, answer]) => {
        answers.push({ question_id: qid, answer, student_name: r.student_name, student_email: r.student_email })
      })
    })

    // Get tracking info
    let survey: any[] = []
    try {
      survey = await sql`
        SELECT s.*, c.title as course_title, co.name as cohort_name, m.title as module_title
        FROM surveys s
        LEFT JOIN courses c ON s.course_id = c.id
        LEFT JOIN cohorts co ON s.cohort_id = co.id
        LEFT JOIN modules m ON s.module_id = m.id
        WHERE s.id = ${id} LIMIT 1
      `
    } catch (_) {
      survey = await sql`SELECT s.*, c.title as course_title FROM surveys s LEFT JOIN courses c ON s.course_id = c.id WHERE s.id = ${id} LIMIT 1`
    }

    return NextResponse.json({ questions, total_responses, answers, survey: survey[0], responses })
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
    sql`SELECT id, title FROM courses WHERE status != 'archived' ORDER BY title`,
  ])

  // Get modules for dropdown
  let modules: any[] = []
  try {
    modules = await sql`SELECT id, title, course_id FROM modules WHERE is_published = true ORDER BY title`
  } catch (_) {}

  return NextResponse.json({ surveys, courses, modules })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { title, description, type, course_id, cohort_id, module_id, is_anonymous, questions } = await request.json()

  await ensureCohortColumn()

  let survey: any[]
  try {
    survey = await sql`
      INSERT INTO surveys (title, description, type, course_id, cohort_id, module_id, is_anonymous, created_by)
      VALUES (${title}, ${description || ''}, ${type || 'feedback'},
        ${course_id || null}, ${cohort_id || null}, ${module_id || null},
        ${is_anonymous ?? true}, ${userId})
      RETURNING *
    `
  } catch (_) {
    // Fallback without new columns
    survey = await sql`
      INSERT INTO surveys (title, description, type, course_id, is_anonymous, created_by)
      VALUES (${title}, ${description || ''}, ${type || 'feedback'},
        ${course_id || null}, ${is_anonymous ?? true}, ${userId})
      RETURNING *
    `
  }

  const surveyId = survey[0].id
  if (questions?.length) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question?.trim()) continue
      await sql`
        INSERT INTO survey_questions (survey_id, question, type, options, required, position)
        VALUES (${surveyId}, ${q.question}, ${q.type}, ${JSON.stringify(q.options || [])}, ${q.required ?? true}, ${i})
      `
    }
  }
  return NextResponse.json({ data: { ...survey[0], question_count: questions?.length || 0, response_count: 0 } })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, title, description, type, course_id, cohort_id, module_id, is_anonymous, questions } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await ensureCohortColumn()

  try {
    await sql`
      UPDATE surveys SET
        title = ${title}, description = ${description || ''}, type = ${type || 'feedback'},
        course_id = ${course_id || null}, cohort_id = ${cohort_id || null},
        module_id = ${module_id || null}, is_anonymous = ${is_anonymous ?? true}
      WHERE id = ${id}
    `
  } catch (_) {
    await sql`
      UPDATE surveys SET title = ${title}, description = ${description || ''},
        type = ${type || 'feedback'}, course_id = ${course_id || null}, is_anonymous = ${is_anonymous ?? true}
      WHERE id = ${id}
    `
  }

  await sql`DELETE FROM survey_questions WHERE survey_id = ${id}`
  if (questions?.length) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question?.trim()) continue
      await sql`
        INSERT INTO survey_questions (survey_id, question, type, options, required, position)
        VALUES (${id}, ${q.question}, ${q.type}, ${JSON.stringify(q.options || [])}, ${q.required ?? true}, ${i})
      `
    }
  }
  return NextResponse.json({ data: { id } })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, is_active } = await request.json()
  await sql`UPDATE surveys SET is_active = ${is_active} WHERE id = ${id}`
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await sql`DELETE FROM survey_responses WHERE survey_id = ${id}`
  await sql`DELETE FROM survey_questions WHERE survey_id = ${id}`
  await sql`DELETE FROM surveys WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
