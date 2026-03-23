export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Login first' }, { status: 401 })
  const userId = (session.user as any).id

  const { neon } = await import('@neondatabase/serverless')
  const db = neon(process.env.DATABASE_URL!)

  // Get ALL actual columns in quizzes table
  const cols = await (db as any).query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'quizzes' ORDER BY ordinal_position`)
  const existing = cols.rows.map((r: any) => r.column_name)

  // Add every column that might be missing
  const needed = [
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id)`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description TEXT`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS instructions TEXT`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70`,
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 3`,
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
    `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`,
  ]

  const results: Record<string, string> = {}
  for (const sql of needed) {
    try {
      await (db as any).query(sql)
      results[sql.slice(32, 55)] = '✓'
    } catch(e: any) {
      results[sql.slice(32, 55)] = '✗ ' + e.message.slice(0, 60)
    }
  }

  // Final INSERT test
  try {
    const test = await (db as any).query(`INSERT INTO quizzes (title, status, created_by) VALUES ('TEST', 'draft', '${userId}') RETURNING id`)
    await (db as any).query(`DELETE FROM quizzes WHERE id = '${test.rows[0].id}'`)
    results['FINAL'] = '✓ WORKS!'
  } catch(e: any) {
    results['FINAL'] = '✗ ' + e.message
  }

  return NextResponse.json({ existing_cols: existing, results })
}
