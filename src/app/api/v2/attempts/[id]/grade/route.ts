export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const attempt = await sql`SELECT qa.*, u.full_name, u.email FROM quiz_attempts qa JOIN users u ON qa.student_id = u.id WHERE qa.id = ${params.id} LIMIT 1`
  if (!attempt[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const answers = await sql`
    SELECT aa.*, q.text as question_text, q.type, q.points, q.explanation, q.requires_manual_grading,
      json_agg(json_build_object('id',o.id,'text',o.text,'is_correct',o.is_correct) ORDER BY o.position) FILTER (WHERE o.id IS NOT NULL) as options
    FROM attempt_answers aa JOIN questions q ON aa.question_id = q.id
    LEFT JOIN question_options o ON o.question_id = q.id
    WHERE aa.attempt_id = ${params.id} GROUP BY aa.id, q.text, q.type, q.points, q.explanation, q.requires_manual_grading ORDER BY q.position`
  return NextResponse.json({ data: { attempt: attempt[0], answers } })
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { grades } = await req.json()
  for (const g of grades) {
    await sql`UPDATE attempt_answers SET manual_score = ${g.score}, instructor_feedback = ${g.feedback||null} WHERE attempt_id = ${params.id} AND question_id = ${g.question_id}`
  }
  const answers = await sql`SELECT aa.auto_score, aa.manual_score, q.points FROM attempt_answers aa JOIN questions q ON aa.question_id = q.id WHERE aa.attempt_id = ${params.id}`
  const totalPoints = answers.reduce((s: number, a: any) => s + parseFloat(a.points||1), 0)
  const earned = answers.reduce((s: number, a: any) => s + parseFloat(a.manual_score ?? a.auto_score ?? 0), 0)
  const finalScore = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0
  const attempt = await sql`SELECT quiz_id FROM quiz_attempts WHERE id = ${params.id} LIMIT 1`
  const quiz = await sql`SELECT passing_score FROM quizzes WHERE id = ${attempt[0].quiz_id} LIMIT 1`
  const passed = finalScore >= (quiz[0].passing_score || 70)
  await sql`UPDATE quiz_attempts SET status = 'graded', final_score = ${finalScore}, passed = ${passed}, graded_at = NOW() WHERE id = ${params.id}`
  return NextResponse.json({ data: { final_score: finalScore, passed } })
}
