export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const difficulty = searchParams.get('difficulty')
  const search = searchParams.get('search')
  
  const questions = await sql`
    SELECT q.*, 
      json_agg(json_build_object('id',o.id,'text',o.text,'is_correct',o.is_correct,'match_text',o.match_text,'position',o.position) ORDER BY o.position) FILTER (WHERE o.id IS NOT NULL) as options,
      (SELECT COUNT(*) FROM questions q2 WHERE q2.bank_id = q.id) as usage_count,
      u.full_name as author_name
    FROM questions q
    LEFT JOIN question_options o ON o.question_id = q.id
    LEFT JOIN users u ON q.created_by = u.id
    WHERE q.quiz_id IS NULL
      AND (${type}::text IS NULL OR q.type = ${type})
      AND (${difficulty}::text IS NULL OR q.difficulty = ${difficulty})
      AND (${search}::text IS NULL OR q.text ILIKE ${'%'+(search||'')+'%'})
    GROUP BY q.id, u.full_name ORDER BY q.created_at DESC`
  return NextResponse.json({ data: questions })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const manualGrading = ['essay','file_upload'].includes(body.type)
  const q = await sql`
    INSERT INTO questions (type, text, points, difficulty, hint_text, explanation, topic_tags,
      case_sensitive, partial_credit, requires_manual_grading, created_by)
    VALUES (${body.type||'mcq'}, ${body.text}, ${body.points||1}, ${body.difficulty||'medium'},
      ${body.hint_text||null}, ${body.explanation||null}, ${body.topic_tags||null},
      ${body.case_sensitive||false}, ${body.partial_credit||false}, ${manualGrading},
      ${(session.user as any).id})
    RETURNING id`
  for (let i = 0; i < (body.options||[]).length; i++) {
    const o = body.options[i]
    if (!o.text?.trim()) continue
    await sql`INSERT INTO question_options (question_id, text, is_correct, match_text, position) VALUES (${q[0].id}, ${o.text}, ${o.is_correct||false}, ${o.match_text||null}, ${i})`
  }
  return NextResponse.json({ data: { id: q[0].id } })
}
