export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Login first' }, { status: 401 })

  // Try the exact INSERT that fails
  try {
    const test = await sql`
      INSERT INTO quizzes (course_id, lesson_id, title, description, instructions,
        time_limit_minutes, passing_score, max_attempts, cooldown_minutes, grading_method,
        shuffle_questions, shuffle_options, show_results_immediately, show_correct_answers,
        show_explanations, available_from, available_until, require_previous_lesson,
        status, created_by)
      VALUES (
        null, null, 'TEST_DELETE_ME', null, null,
        null, 70, 3, 0,
        'highest', false, false,
        true, 'immediately',
        true, null, null,
        false, 'draft', ${(session.user as any).id}
      ) RETURNING id`
    // Clean up
    await sql`DELETE FROM quizzes WHERE id = ${test[0].id}`
    return NextResponse.json({ success: true, message: 'INSERT works fine' })
  } catch(e: any) {
    return NextResponse.json({ 
      insert_error: e.message,
      hint: 'This is the exact error when saving a quiz'
    })
  }
}
