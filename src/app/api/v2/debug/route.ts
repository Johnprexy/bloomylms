export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
export async function GET() {
  try {
    // Test actual INSERT like the quiz save does
    const testResult = await sql`
      INSERT INTO quizzes (title, status, created_by)
      VALUES ('__test__', 'draft', (SELECT id FROM users LIMIT 1))
      RETURNING id`
    const testId = testResult[0].id
    await sql`DELETE FROM quizzes WHERE id = ${testId}`
    return NextResponse.json({ insert_test: 'PASSED ✓' })
  } catch(e: any) {
    return NextResponse.json({ insert_test: 'FAILED', error: e.message, hint: e.hint || null })
  }
}
