export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Login first' }, { status: 401 })
  const userId = (session.user as any).id

  try {
    const test = await sql`
      INSERT INTO quizzes (title, status, created_by)
      VALUES ('TEST_DELETE_ME', 'draft', ${userId})
      RETURNING id`
    await sql`DELETE FROM quizzes WHERE id = ${test[0].id}`
    return NextResponse.json({ status: '✓ Quiz system ready — go save your quiz!' })
  } catch(e: any) {
    return NextResponse.json({ status: '✗ Still broken', error: e.message })
  }
}
