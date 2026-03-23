export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
export async function GET() {
  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('quizzes','questions','question_options','quiz_attempts','attempt_answers') ORDER BY table_name`
    const found = tables.map((t: any) => t.table_name)
    const missing = ['quizzes','questions','question_options','quiz_attempts','attempt_answers'].filter(t => !found.includes(t))
    return NextResponse.json({ found, missing, status: missing.length === 0 ? 'all tables exist ✓' : `missing: ${missing.join(', ')}` })
  } catch(e: any) {
    return NextResponse.json({ error: e.message })
  }
}
