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
  const lessonId = searchParams.get('lesson_id')
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

  const quiz = await sql`SELECT * FROM quizzes WHERE lesson_id = ${lessonId} LIMIT 1`
  if (!quiz[0]) return NextResponse.json({ data: null })

  const questions = await sql`SELECT * FROM quiz_questions WHERE quiz_id = ${quiz[0].id} ORDER BY position`
  const attempts = await sql`
    SELECT qa.*, u.full_name, u.email
    FROM quiz_attempts qa
    JOIN users u ON qa.student_id = u.id
    WHERE qa.quiz_id = ${quiz[0].id}
    ORDER BY qa.completed_at DESC NULLS LAST
  `
  return NextResponse.json({ data: { ...quiz[0], questions }, attempts })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { lesson_id, course_id, title, instructions, passing_score, time_limit_minutes,
    attempts_allowed, shuffle_questions, show_results, questions } = body

  if (!lesson_id) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })

  // Upsert quiz
  const existing = await sql`SELECT id FROM quizzes WHERE lesson_id = ${lesson_id} LIMIT 1`
  let quizId: string

  if (existing[0]) {
    await sql`
      UPDATE quizzes SET
        title = ${title || 'Quiz'},
        instructions = ${instructions || null},
        passing_score = ${passing_score || 70},
        time_limit_minutes = ${time_limit_minutes || null},
        attempts_allowed = ${attempts_allowed || 3},
        shuffle_questions = ${shuffle_questions || false},
        show_results = ${show_results ?? true}
      WHERE id = ${existing[0].id}
    `
    quizId = existing[0].id
  } else {
    const newQuiz = await sql`
      INSERT INTO quizzes (lesson_id, title, instructions, passing_score, time_limit_minutes, attempts_allowed, shuffle_questions, show_results)
      VALUES (${lesson_id}, ${title || 'Quiz'}, ${instructions || null}, ${passing_score || 70},
        ${time_limit_minutes || null}, ${attempts_allowed || 3}, ${shuffle_questions || false}, ${show_results ?? true})
      RETURNING id
    `
    quizId = newQuiz[0].id
  }

  // Rebuild questions
  await sql`DELETE FROM quiz_questions WHERE quiz_id = ${quizId}`
  for (let i = 0; i < (questions || []).length; i++) {
    const q = questions[i]
    if (!q.question?.trim()) continue
    await sql`
      INSERT INTO quiz_questions (quiz_id, question, type, options, correct_answer, correct_answers, explanation, points, position)
      VALUES (
        ${quizId}, ${q.question}, ${q.type || 'multiple_choice'},
        ${JSON.stringify(q.options || [])},
        ${q.correct_answer || ''},
        ${JSON.stringify(q.correct_answers || [])},
        ${q.explanation || null}, ${q.points || 1}, ${i}
      )
    `
  }

  // Auto-create grade item for this quiz in the gradebook
  if (course_id) {
    const lesson = await sql`SELECT title FROM lessons WHERE id = ${lesson_id} LIMIT 1`
    const lessonTitle = lesson[0]?.title || title || 'Quiz'
    const totalPoints = questions?.reduce((s: number, q: any) => s + (q.points || 1), 0) || 10

    const existingItem = await sql`
      SELECT id FROM grade_items WHERE source_type = 'quiz' AND source_id = ${quizId} LIMIT 1
    `
    if (!existingItem[0]) {
      const gradeItem = await sql`
        INSERT INTO grade_items (course_id, title, category, max_score, weight_percent, source_type, source_id, position)
        SELECT ${course_id}, ${lessonTitle}, 'quiz', ${totalPoints}, 0,
          'quiz', ${quizId},
          COALESCE((SELECT MAX(position) + 1 FROM grade_items WHERE course_id = ${course_id}), 0)
        RETURNING id
      `
      await sql`UPDATE quizzes SET grade_item_id = ${gradeItem[0].id} WHERE id = ${quizId}`
    }
  }

  return NextResponse.json({ data: { quiz_id: quizId, question_count: questions?.length || 0 } })
}
