export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const { quiz_id, answers, score, passed, completed_at } = await request.json()

  // Save attempt
  const attempt = await sql`
    INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, passed, completed_at)
    VALUES (${quiz_id}, ${userId}, ${JSON.stringify(answers)}, ${score}, ${passed}, ${completed_at})
    RETURNING *
  `

  // Auto-post score to gradebook
  try {
    const quiz = await sql`SELECT grade_item_id, passing_score FROM quizzes WHERE id = ${quiz_id} LIMIT 1`
    if (quiz[0]?.grade_item_id) {
      const gradeItem = await sql`SELECT max_score FROM grade_items WHERE id = ${quiz[0].grade_item_id} LIMIT 1`
      const rawScore = gradeItem[0] ? (score / 100) * Number(gradeItem[0].max_score) : score
      await sql`
        INSERT INTO grades (grade_item_id, student_id, score, graded_at)
        VALUES (${quiz[0].grade_item_id}, ${userId}, ${rawScore}, NOW())
        ON CONFLICT (grade_item_id, student_id)
        DO UPDATE SET score = EXCLUDED.score, graded_at = NOW()
      `
    }
  } catch (e) {
    console.error('Auto-grade failed:', e)
  }

  // Mark lesson complete if passed
  if (passed) {
    try {
      const quizLesson = await sql`SELECT lesson_id FROM quizzes WHERE id = ${quiz_id} LIMIT 1`
      if (quizLesson[0]?.lesson_id) {
        const lesson = await sql`SELECT course_id FROM lessons WHERE id = ${quizLesson[0].lesson_id} LIMIT 1`
        if (lesson[0]?.course_id) {
          await sql`
            INSERT INTO lesson_progress (student_id, lesson_id, course_id, completed, completed_at)
            VALUES (${userId}, ${quizLesson[0].lesson_id}, ${lesson[0].course_id}, true, NOW())
            ON CONFLICT (student_id, lesson_id) DO UPDATE SET completed = true, completed_at = NOW()
          `
        }
      }
    } catch (e) { console.error('Progress update failed:', e) }
  }

  return NextResponse.json({ data: attempt[0] })
}
