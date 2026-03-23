export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

// Auto-save answers
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { answers } = await req.json()
  await sql`UPDATE quiz_attempts SET answers = ${JSON.stringify(answers)} WHERE id = ${params.id} AND status = 'in_progress'`
  return NextResponse.json({ saved: true })
}

// Submit attempt
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { answers, time_taken_seconds } = await req.json()

  const attempts = await sql`SELECT * FROM quiz_attempts WHERE id = ${params.id} AND student_id = ${userId} AND status = 'in_progress' LIMIT 1`
  if (!attempts[0]) return NextResponse.json({ error: 'Attempt not found or already submitted' }, { status: 404 })
  const attempt = attempts[0]

  // Fetch quiz + questions with options
  const quizRows = await sql`SELECT * FROM quizzes WHERE id = ${attempt.quiz_id} LIMIT 1`
  const quiz = quizRows[0]
  const questions = await sql`
    SELECT q.*, json_agg(json_build_object('id',o.id,'text',o.text,'is_correct',o.is_correct,'match_text',o.match_text,'position',o.position) ORDER BY o.position) FILTER (WHERE o.id IS NOT NULL) as options
    FROM questions q LEFT JOIN question_options o ON o.question_id = q.id
    WHERE q.quiz_id = ${attempt.quiz_id} GROUP BY q.id ORDER BY q.position`

  // Auto-grade
  let autoPoints = 0
  let totalAutoPoints = 0
  let hasManual = false
  const answerDetails: any[] = []

  for (const q of questions) {
    const ans = answers?.[q.id]
    const qPoints = parseFloat(q.points) || 1
    const opts = Array.isArray(q.options) ? q.options : []

    if (q.requires_manual_grading) { hasManual = true; answerDetails.push({ qid: q.id, auto_score: null, is_correct: null }); continue }
    totalAutoPoints += qPoints

    let earned = 0, correct = false
    if (q.type === 'mcq' || q.type === 'true_false') {
      const correctOpt = opts.find((o: any) => o.is_correct)
      correct = ans === correctOpt?.id || ans === correctOpt?.text
      earned = correct ? qPoints : 0
    } else if (q.type === 'multi_select') {
      const correctIds = opts.filter((o: any) => o.is_correct).map((o: any) => o.id)
      const selectedIds: string[] = Array.isArray(ans) ? ans : []
      if (q.partial_credit) {
        const correctSelected = selectedIds.filter((id: string) => correctIds.includes(id)).length
        const wrongSelected = selectedIds.filter((id: string) => !correctIds.includes(id)).length
        earned = Math.max(0, ((correctSelected - wrongSelected) / correctIds.length) * qPoints)
        correct = earned === qPoints
      } else {
        correct = correctIds.length === selectedIds.length && correctIds.every((id: string) => selectedIds.includes(id))
        earned = correct ? qPoints : 0
      }
    } else if (q.type === 'short_answer') {
      const accepted = opts.map((o: any) => o.text?.trim().toLowerCase())
      const userAns = (ans || '').trim()
      correct = accepted.includes(q.case_sensitive ? userAns : userAns.toLowerCase())
      earned = correct ? qPoints : 0
    } else if (q.type === 'ordering') {
      const correctOrder = opts.sort((a: any, b: any) => a.position - b.position).map((o: any) => o.id)
      const userOrder: string[] = Array.isArray(ans) ? ans : []
      correct = JSON.stringify(correctOrder) === JSON.stringify(userOrder)
      earned = correct ? qPoints : 0
    } else if (q.type === 'matching') {
      const pairs = opts.reduce((acc: any, o: any) => { if (o.match_text) acc[o.id] = o.match_text; return acc }, {})
      const userPairs = ans || {}
      const total = Object.keys(pairs).length
      let correctPairs = 0
      for (const [k, v] of Object.entries(pairs)) { if (userPairs[k] === v) correctPairs++ }
      if (q.partial_credit) { earned = (correctPairs / total) * qPoints; correct = correctPairs === total }
      else { correct = correctPairs === total; earned = correct ? qPoints : 0 }
    }

    autoPoints += earned
    answerDetails.push({ qid: q.id, auto_score: earned, is_correct: correct })
  }

  // Save per-question answers
  for (const d of answerDetails) {
    await sql`
      INSERT INTO attempt_answers (attempt_id, question_id, answer, is_correct, auto_score)
      VALUES (${params.id}, ${d.qid}, ${JSON.stringify(answers?.[d.qid] || null)}, ${d.is_correct}, ${d.auto_score})
      ON CONFLICT (attempt_id, question_id) DO UPDATE SET answer = EXCLUDED.answer, is_correct = EXCLUDED.is_correct, auto_score = EXCLUDED.auto_score`
  }

  const autoScore = totalAutoPoints > 0 ? Math.round((autoPoints / totalAutoPoints) * 100) : 0
  const passed = !hasManual && autoScore >= (quiz.passing_score || 70)

  await sql`
    UPDATE quiz_attempts SET
      status = ${hasManual ? 'submitted' : 'graded'},
      submitted_at = NOW(), answers = ${JSON.stringify(answers||{})},
      auto_score = ${autoScore}, final_score = ${hasManual ? null : autoScore},
      passed = ${hasManual ? null : passed},
      time_taken_seconds = ${time_taken_seconds || null}
    WHERE id = ${params.id}`

  // Update lesson progress if passed
  if (passed && quiz.lesson_id) {
    const studentLesson = await sql`SELECT id FROM lesson_progress WHERE student_id = ${userId} AND lesson_id = ${quiz.lesson_id} LIMIT 1`
    if (!studentLesson[0]) {
      await sql`INSERT INTO lesson_progress (student_id, lesson_id, course_id, completed, completed_at) VALUES (${userId}, ${quiz.lesson_id}, ${quiz.course_id}, true, NOW()) ON CONFLICT DO NOTHING`
    }
  }

  return NextResponse.json({ data: { score: autoScore, passed, has_manual: hasManual, answer_details: answerDetails } })
}
