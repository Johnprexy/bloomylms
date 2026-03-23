export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
export async function GET() {
  try {
    const cols = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('quizzes','questions','question_options','quiz_attempts','attempt_answers')
      ORDER BY table_name, ordinal_position`
    const grouped: any = {}
    for (const c of cols) {
      if (!grouped[c.table_name]) grouped[c.table_name] = []
      grouped[c.table_name].push(c.column_name)
    }
    return NextResponse.json(grouped)
  } catch(e: any) {
    return NextResponse.json({ error: e.message })
  }
}
