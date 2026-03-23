export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [attempts, questions] = await Promise.all([
    sql`SELECT qa.*, u.full_name, u.email FROM quiz_attempts qa JOIN users u ON qa.student_id = u.id WHERE qa.quiz_id = ${params.id} AND qa.status != 'abandoned' ORDER BY qa.submitted_at DESC`,
    sql`SELECT q.id, q.text, q.type, q.points, COUNT(aa.id) as answer_count, SUM(CASE WHEN aa.is_correct THEN 1 ELSE 0 END) as correct_count FROM questions q LEFT JOIN attempt_answers aa ON aa.question_id = q.id WHERE q.quiz_id = ${params.id} GROUP BY q.id ORDER BY q.position`
  ])
  const submitted = attempts.filter((a: any) => ['submitted','graded'].includes(a.status))
  const passed = submitted.filter((a: any) => a.passed)
  const scores = submitted.map((a: any) => parseFloat(a.final_score || a.auto_score || 0))
  const avg = scores.length ? scores.reduce((s: number, n: number) => s + n, 0) / scores.length : 0
  const buckets = [[0,10],[10,20],[20,30],[30,40],[40,50],[50,60],[60,70],[70,80],[80,90],[90,101]]
  return NextResponse.json({ data: {
    total_attempts: submitted.length,
    unique_students: new Set(submitted.map((a: any) => a.student_id)).size,
    avg_score: Math.round(avg * 10) / 10,
    pass_rate: submitted.length ? Math.round((passed.length / submitted.length) * 100) : 0,
    pass_count: passed.length,
    score_distribution: buckets.map(([lo, hi]) => ({ range: `${lo}-${hi === 101 ? 100 : hi}`, count: scores.filter((s: number) => s >= lo && s < hi).length })),
    attempts: submitted,
    per_question: questions.map((q: any) => ({ ...q, pct_correct: q.answer_count > 0 ? Math.round((q.correct_count / q.answer_count) * 100) : 0, difficulty_flag: parseInt(q.answer_count) > 5 && (q.correct_count / q.answer_count) < 0.4 ? 'hard' : null }))
  }})
}
