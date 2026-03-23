export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get('course_id')
  const lessonId = searchParams.get('lesson_id')
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let data
  if (lessonId) {
    data = await sql`
      SELECT q.*, 
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count,
        (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) as attempt_count,
        (SELECT AVG(final_score) FROM quiz_attempts WHERE quiz_id = q.id AND status = 'submitted') as avg_score,
        (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND passed = true) as pass_count
      FROM quizzes q WHERE q.lesson_id = ${lessonId} LIMIT 1`
  } else {
    data = await sql`
      SELECT q.*, c.title as course_title,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count,
        (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND status != 'abandoned') as attempt_count,
        (SELECT ROUND(AVG(final_score),1) FROM quiz_attempts WHERE quiz_id = q.id AND status = 'submitted') as avg_score,
        (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND passed = true) as pass_count
      FROM quizzes q
      LEFT JOIN courses c ON q.course_id = c.id
      WHERE (${courseId}::text IS NULL OR q.course_id = ${courseId}::uuid)
        AND (${status}::text IS NULL OR q.status = ${status})
        AND (${search}::text IS NULL OR q.title ILIKE ${'%'+(search||'')+'%'})
      ORDER BY q.updated_at DESC`
  }
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { course_id, lesson_id, title, description, instructions, time_limit_minutes,
    passing_score, max_attempts, cooldown_minutes, grading_method, shuffle_questions,
    shuffle_options, show_results_immediately, show_correct_answers, show_explanations,
    available_from, available_until, require_previous_lesson } = body
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })
  
  const quiz = await sql`
    INSERT INTO quizzes (course_id, lesson_id, title, description, instructions,
      time_limit_minutes, passing_score, max_attempts, cooldown_minutes, grading_method,
      shuffle_questions, shuffle_options, show_results_immediately, show_correct_answers,
      show_explanations, available_from, available_until, require_previous_lesson,
      status, created_by)
    VALUES (
      ${course_id||null}, ${lesson_id||null}, ${title}, ${description||null}, ${instructions||null},
      ${time_limit_minutes||null}, ${passing_score||70}, ${max_attempts||3}, ${cooldown_minutes||0},
      ${grading_method||'highest'}, ${shuffle_questions||false}, ${shuffle_options||false},
      ${show_results_immediately??true}, ${show_correct_answers||'immediately'},
      ${show_explanations??true}, ${available_from||null}, ${available_until||null},
      ${require_previous_lesson||false}, 'draft', ${(session.user as any).id}
    ) RETURNING *`
  return NextResponse.json({ data: quiz[0] })
}
