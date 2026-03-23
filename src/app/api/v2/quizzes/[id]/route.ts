export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const quiz = await sql`SELECT q.*, c.title as course_title FROM quizzes q LEFT JOIN courses c ON q.course_id = c.id WHERE q.id = ${params.id} LIMIT 1`
  if (!quiz[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const questions = await sql`
    SELECT q.*, json_agg(json_build_object('id',o.id,'text',o.text,'is_correct',o.is_correct,'match_text',o.match_text,'position',o.position) ORDER BY o.position) FILTER (WHERE o.id IS NOT NULL) as options
    FROM questions q LEFT JOIN question_options o ON o.question_id = q.id
    WHERE q.quiz_id = ${params.id} GROUP BY q.id ORDER BY q.position`
  return NextResponse.json({ data: { ...quiz[0], questions } })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, description, instructions, time_limit_minutes, passing_score, max_attempts,
    cooldown_minutes, grading_method, shuffle_questions, shuffle_options,
    show_results_immediately, show_correct_answers, show_explanations,
    available_from, available_until, require_previous_lesson, status } = body
  const quiz = await sql`
    UPDATE quizzes SET
      title = COALESCE(${title}, title),
      description = ${description ?? null},
      instructions = ${instructions ?? null},
      time_limit_minutes = ${time_limit_minutes ?? null},
      passing_score = COALESCE(${passing_score}, passing_score),
      max_attempts = COALESCE(${max_attempts}, max_attempts),
      cooldown_minutes = COALESCE(${cooldown_minutes}, cooldown_minutes),
      grading_method = COALESCE(${grading_method}, grading_method),
      shuffle_questions = COALESCE(${shuffle_questions}, shuffle_questions),
      shuffle_options = COALESCE(${shuffle_options}, shuffle_options),
      show_results_immediately = COALESCE(${show_results_immediately}, show_results_immediately),
      show_correct_answers = COALESCE(${show_correct_answers}, show_correct_answers),
      show_explanations = COALESCE(${show_explanations}, show_explanations),
      available_from = ${available_from ?? null},
      available_until = ${available_until ?? null},
      require_previous_lesson = COALESCE(${require_previous_lesson}, require_previous_lesson),
      status = COALESCE(${status}, status),
      updated_at = NOW()
    WHERE id = ${params.id} RETURNING *`
  return NextResponse.json({ data: quiz[0] })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await sql`DELETE FROM quiz_attempts WHERE quiz_id = ${params.id}`
  await sql`DELETE FROM quizzes WHERE id = ${params.id}`
  return NextResponse.json({ success: true })
}
