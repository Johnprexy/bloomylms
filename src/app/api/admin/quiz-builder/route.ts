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
  const lessonId  = searchParams.get('lesson_id')
  const quizId    = searchParams.get('quiz_id')
  const courseId  = searchParams.get('course_id')

  // Get all quizzes for a course
  if (courseId) {
    const quizzes = await sql`
      SELECT q.id, q.title, q.passing_score, q.attempts_allowed,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
        (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) as attempt_count,
        l.title as lesson_title
      FROM quizzes q
      LEFT JOIN lessons l ON q.lesson_id = l.id
      LEFT JOIN modules m ON l.module_id = m.id
      WHERE q.course_id = ${courseId} OR m.course_id = ${courseId}
      ORDER BY q.created_at DESC
    `
    return NextResponse.json({ quizzes })
  }

  // Get a specific quiz by id or lesson_id
  let quiz: any[] = []
  if (quizId) {
    quiz = await sql`SELECT * FROM quizzes WHERE id = ${quizId} LIMIT 1`
  } else if (lessonId) {
    quiz = await sql`SELECT * FROM quizzes WHERE lesson_id = ${lessonId} LIMIT 1`
  }

  if (!quiz[0]) return NextResponse.json({ data: null })

  const questions = await sql`SELECT * FROM quiz_questions WHERE quiz_id = ${quiz[0].id} ORDER BY position`
  const attempts = await sql`
    SELECT qa.*, u.full_name, u.email
    FROM quiz_attempts qa JOIN users u ON qa.student_id = u.id
    WHERE qa.quiz_id = ${quiz[0].id} ORDER BY qa.completed_at DESC NULLS LAST
  `
  return NextResponse.json({ data: { ...quiz[0], questions }, attempts })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { course_id, lesson_id, quiz_id, title, passing_score, time_limit_minutes,
    attempts_allowed, questions } = body

  if (!course_id && !lesson_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  let quizIdResult: string

  if (quiz_id) {
    // Update existing
    await sql`
      UPDATE quizzes SET
        title = ${title}, passing_score = ${passing_score || 70},
        time_limit_minutes = ${time_limit_minutes || null},
        attempts_allowed = ${attempts_allowed || 3}
      WHERE id = ${quiz_id}
    `
    quizIdResult = quiz_id
  } else {
    // Create new — standalone course-level quiz (no lesson required)
    const newQuiz = await sql`
      INSERT INTO quizzes (course_id, lesson_id, title, passing_score, time_limit_minutes, attempts_allowed)
      VALUES (
        ${course_id || null},
        ${lesson_id || null},
        ${title},
        ${passing_score || 70},
        ${time_limit_minutes || null},
        ${attempts_allowed || 3}
      ) RETURNING id
    `
    quizIdResult = newQuiz[0].id
  }

  // Rebuild questions
  await sql`DELETE FROM quiz_questions WHERE quiz_id = ${quizIdResult}`
  for (let i = 0; i < (questions || []).length; i++) {
    const q = questions[i]
    if (!q.question?.trim()) continue
    await sql`
      INSERT INTO quiz_questions (quiz_id, question, type, options, correct_answer, correct_answers, explanation, points, position)
      VALUES (
        ${quizIdResult}, ${q.question}, ${q.type || 'multiple_choice'},
        ${JSON.stringify(q.options || [])},
        ${q.correct_answer || ''},
        ${JSON.stringify(q.correct_answers || [])},
        ${q.explanation || null},
        ${q.points || 1}, ${i}
      )
    `
  }

  // Auto-create or update grade item in gradebook
  const resolvedCourseId = course_id || (lesson_id ? (await sql`SELECT m.course_id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE l.id = ${lesson_id} LIMIT 1`)[0]?.course_id : null)
  if (resolvedCourseId) {
    const totalPoints = questions?.reduce((s: number, q: any) => s + (q.points || 1), 0) || 10
    const existingItem = await sql`SELECT id FROM grade_items WHERE source_type = 'quiz' AND source_id = ${quizIdResult} LIMIT 1`
    if (!existingItem[0]) {
      const gradeItem = await sql`
        INSERT INTO grade_items (course_id, title, category, max_score, weight_percent, source_type, source_id, position)
        VALUES (
          ${resolvedCourseId}, ${title}, 'quiz', ${totalPoints}, 0, 'quiz', ${quizIdResult},
          COALESCE((SELECT MAX(position) + 1 FROM grade_items WHERE course_id = ${resolvedCourseId}), 0)
        ) RETURNING id
      `
      await sql`UPDATE quizzes SET grade_item_id = ${gradeItem[0].id} WHERE id = ${quizIdResult}`
    } else {
      await sql`UPDATE grade_items SET title = ${title}, max_score = ${totalPoints} WHERE id = ${existingItem[0].id}`
    }
  }

  return NextResponse.json({ data: { quiz_id: quizIdResult, question_count: questions?.length || 0 } })
}
