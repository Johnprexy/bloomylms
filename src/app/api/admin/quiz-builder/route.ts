export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }

// GET quiz for a lesson
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
  const quiz = await sql`SELECT * FROM quizzes WHERE lesson_id = ${lessonId} LIMIT 1`
  if (!quiz[0]) return NextResponse.json({ data: null })
  const questions = await sql`SELECT * FROM quiz_questions WHERE quiz_id = ${quiz[0].id} ORDER BY position`
  return NextResponse.json({ data: { ...quiz[0], questions } })
}

// POST create/update quiz for a lesson
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { lesson_id, title, passing_score, time_limit_minutes, attempts_allowed, questions } = await request.json()
  if (!lesson_id) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

  // Upsert quiz
  const existing = await sql`SELECT id FROM quizzes WHERE lesson_id = ${lesson_id} LIMIT 1`
  let quizId: string

  if (existing[0]) {
    await sql`UPDATE quizzes SET title = ${title || 'Quiz'}, passing_score = ${passing_score || 70}, time_limit_minutes = ${time_limit_minutes || null}, attempts_allowed = ${attempts_allowed || 3} WHERE id = ${existing[0].id}`
    quizId = existing[0].id
  } else {
    const newQuiz = await sql`
      INSERT INTO quizzes (lesson_id, title, passing_score, time_limit_minutes, attempts_allowed)
      VALUES (${lesson_id}, ${title || 'Quiz'}, ${passing_score || 70}, ${time_limit_minutes || null}, ${attempts_allowed || 3})
      RETURNING id
    `
    quizId = newQuiz[0].id
  }

  // Rebuild questions
  await sql`DELETE FROM quiz_questions WHERE quiz_id = ${quizId}`
  for (let i = 0; i < (questions || []).length; i++) {
    const q = questions[i]
    await sql`
      INSERT INTO quiz_questions (quiz_id, question, type, options, correct_answer, explanation, points, position)
      VALUES (${quizId}, ${q.question}, ${q.type || 'multiple_choice'}, ${JSON.stringify(q.options || [])}, ${q.correct_answer || ''}, ${q.explanation || null}, ${q.points || 1}, ${i})
    `
  }

  return NextResponse.json({ data: { quiz_id: quizId, question_count: questions?.length || 0 } })
}
