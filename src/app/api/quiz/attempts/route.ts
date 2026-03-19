export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { quiz_id, answers, score, passed, completed_at } = await request.json()
  const data = await sql`INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, passed, completed_at) VALUES (${quiz_id}, ${userId}, ${JSON.stringify(answers)}, ${score}, ${passed}, ${completed_at}) RETURNING *`
  return NextResponse.json({ data: data[0] })
}
