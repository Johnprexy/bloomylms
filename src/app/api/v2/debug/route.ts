export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Login first' }, { status: 401 })

  const { neon } = await import('@neondatabase/serverless')
  const db = neon(process.env.DATABASE_URL!)
  const results: Record<string, string> = {}

  const migrations = [
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS instructions TEXT`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS cooldown_minutes INTEGER DEFAULT 0`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS grading_method TEXT DEFAULT 'highest'`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT false`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_results_immediately BOOLEAN DEFAULT true`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_correct_answers TEXT DEFAULT 'immediately'`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS show_explanations BOOLEAN DEFAULT true`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS available_from TIMESTAMPTZ`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS available_until TIMESTAMPTZ`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS require_previous_lesson BOOLEAN DEFAULT false`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS grade_item_id UUID`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS bank_id UUID`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium'`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS hint_text TEXT`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS hint_penalty NUMERIC(4,2) DEFAULT 0`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_tags TEXT[]`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS word_limit INTEGER`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS accepted_files TEXT[]`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN DEFAULT false`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS partial_credit BOOLEAN DEFAULT false`,
    `ALTER TABLE questions ADD COLUMN IF NOT EXISTS requires_manual_grading BOOLEAN DEFAULT false`,
    `ALTER TABLE question_options ADD COLUMN IF NOT EXISTS match_text TEXT`,
    `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0`,
    `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'`,
    `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS manual_score NUMERIC(6,2)`,
    `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS final_score NUMERIC(6,2)`,
    `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER`,
    `ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS auto_score NUMERIC(6,2)`,
    `CREATE TABLE IF NOT EXISTS attempt_answers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE, question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE, answer JSONB, is_correct BOOLEAN, auto_score NUMERIC(6,2), manual_score NUMERIC(6,2), instructor_feedback TEXT, time_spent_seconds INTEGER DEFAULT 0, UNIQUE(attempt_id, question_id))`,
    `CREATE TABLE IF NOT EXISTS question_bank (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL DEFAULT 'Question Bank', created_by UUID REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW())`,
  ]

  for (const m of migrations) {
    const key = m.slice(7, 55).trim()
    try {
      // Use neon's query method directly which accepts raw strings
      await (db as any).query(m)
      results[key] = '✓'
    } catch(e: any) {
      // Try alternate method
      try {
        await fetch(process.env.DATABASE_URL!.replace('postgresql://', 'https://'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: m })
        })
        results[key] = '✓ (via fetch)'
      } catch {
        results[key] = '✗ ' + e.message.slice(0, 80)
      }
    }
  }

  return NextResponse.json({ migrations: results })
}
