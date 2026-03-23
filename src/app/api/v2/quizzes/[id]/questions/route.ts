export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const qs = await sql`
    SELECT q.*, json_agg(json_build_object('id',o.id,'text',o.text,'is_correct',o.is_correct,'match_text',o.match_text,'position',o.position) ORDER BY o.position) FILTER (WHERE o.id IS NOT NULL) as options
    FROM questions q LEFT JOIN question_options o ON o.question_id = q.id
    WHERE q.quiz_id = ${params.id} GROUP BY q.id ORDER BY q.position`
  return NextResponse.json({ data: qs })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { questions } = body // array of questions to save (replaces all)
  
  // Delete existing questions for this quiz
  await sql`DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE quiz_id = ${params.id})`
  await sql`DELETE FROM questions WHERE quiz_id = ${params.id}`
  
  const saved = []
  for (let i = 0; i < (questions||[]).length; i++) {
    const q = questions[i]
    if (!q.text?.trim()) continue
    const manualGrading = ['essay','file_upload'].includes(q.type)
    const inserted = await sql`
      INSERT INTO questions (quiz_id, type, text, points, difficulty, hint_text, hint_penalty,
        explanation, topic_tags, word_limit, accepted_files, case_sensitive, partial_credit,
        position, requires_manual_grading)
      VALUES (${params.id}, ${q.type||'mcq'}, ${q.text}, ${q.points||1}, ${q.difficulty||'medium'},
        ${q.hint_text||null}, ${q.hint_penalty||0}, ${q.explanation||null},
        ${q.topic_tags||null}, ${q.word_limit||null}, ${q.accepted_files||null},
        ${q.case_sensitive||false}, ${q.partial_credit||false}, ${i}, ${manualGrading}
      ) RETURNING id`
    const qid = inserted[0].id
    
    // Save options
    for (let j = 0; j < (q.options||[]).length; j++) {
      const o = q.options[j]
      if (!o.text?.trim()) continue
      await sql`INSERT INTO question_options (question_id, text, is_correct, match_text, position)
        VALUES (${qid}, ${o.text}, ${o.is_correct||false}, ${o.match_text||null}, ${j})`
    }
    saved.push(qid)
  }
  
  // Update quiz updated_at
  await sql`UPDATE quizzes SET updated_at = NOW() WHERE id = ${params.id}`
  
  return NextResponse.json({ data: { saved_count: saved.length } })
}
