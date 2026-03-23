export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Login first' }, { status: 401 })
  const userId = (session.user as any).id
  const done: string[] = []
  const failed: string[] = []

  // Run each ALTER one by one using tagged template (empty values = safe raw SQL)
  async function run(label: string, fn: () => Promise<any>) {
    try { await fn(); done.push(label) }
    catch(e: any) { failed.push(`${label}: ${e.message.slice(0,80)}`) }
  }

  await run('created_by',               () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS created_by UUID`)
  await run('course_id',                () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS course_id UUID`)
  await run('lesson_id',                () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS lesson_id UUID`)
  await run('status',                   () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'`)
  await run('description',              () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description TEXT`)
  await run('instructions',             () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS instructions TEXT`)
  await run('time_limit_minutes',       () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER`)
  await run('passing_score',            () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70`)
  await run('max_attempts',             () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 3`)
  await run('cooldown_minutes',         () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS cooldown_minutes INTEGER DEFAULT 0`)
  await run('grading_method',           () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS grading_method TEXT DEFAULT 'highest'`)
  await run('shuffle_questions',        () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false`)
  await run('shuffle_options',          () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT false`)
  await run('show_results_immediately', () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_results_immediately BOOLEAN DEFAULT true`)
  await run('show_correct_answers',     () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_correct_answers TEXT DEFAULT 'immediately'`)
  await run('show_explanations',        () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_explanations BOOLEAN DEFAULT true`)
  await run('available_from',           () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ`)
  await run('available_until',          () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ`)
  await run('require_previous_lesson',  () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS require_previous_lesson BOOLEAN DEFAULT false`)
  await run('updated_at',               () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`)
  await run('grade_item_id',            () => sql`ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS grade_item_id UUID`)
  await run('q.bank_id',                () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS bank_id UUID`)
  await run('q.difficulty',             () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium'`)
  await run('q.hint_text',              () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS hint_text TEXT`)
  await run('q.hint_penalty',           () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS hint_penalty NUMERIC(4,2) DEFAULT 0`)
  await run('q.topic_tags',             () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_tags TEXT[]`)
  await run('q.word_limit',             () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS word_limit INTEGER`)
  await run('q.accepted_files',         () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS accepted_files TEXT[]`)
  await run('q.case_sensitive',         () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN DEFAULT false`)
  await run('q.partial_credit',         () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS partial_credit BOOLEAN DEFAULT false`)
  await run('q.requires_manual',        () => sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS requires_manual_grading BOOLEAN DEFAULT false`)
  await run('qo.match_text',            () => sql`ALTER TABLE question_options ADD COLUMN IF NOT EXISTS match_text TEXT`)
  await run('qa.tab_switch_count',      () => sql`ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0`)
  await run('qa.answers',               () => sql`ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'`)
  await run('qa.manual_score',          () => sql`ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS manual_score NUMERIC(6,2)`)
  await run('qa.final_score',           () => sql`ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS final_score NUMERIC(6,2)`)
  await run('qa.time_taken',            () => sql`ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER`)
  await run('qa.auto_score',            () => sql`ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS auto_score NUMERIC(6,2)`)

  // Final test
  let finalTest = ''
  try {
    const t = await sql`INSERT INTO quizzes (title, status, created_by) VALUES ('TEST', 'draft', ${userId}) RETURNING id`
    await sql`DELETE FROM quizzes WHERE id = ${t[0].id}`
    finalTest = '✓ QUIZ SAVES WORK!'
  } catch(e: any) {
    finalTest = '✗ ' + e.message
  }

  return NextResponse.json({ done, failed, final: finalTest })
}
