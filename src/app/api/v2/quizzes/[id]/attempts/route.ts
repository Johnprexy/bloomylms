export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const attempts = await sql`
    SELECT * FROM quiz_attempts WHERE quiz_id = ${params.id} AND student_id = ${userId}
    ORDER BY attempt_number DESC`
  return NextResponse.json({ data: attempts })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  
  // Check quiz exists and is published
  const quiz = await sql`SELECT * FROM quizzes WHERE id = ${params.id} LIMIT 1`
  if (!quiz[0]) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
  if (quiz[0].status !== 'published') return NextResponse.json({ error: 'Quiz not available' }, { status: 403 })
  
  // Check attempt limit
  const prevAttempts = await sql`SELECT COUNT(*) as n FROM quiz_attempts WHERE quiz_id = ${params.id} AND student_id = ${userId} AND status != 'abandoned'`
  const count = parseInt(prevAttempts[0].n)
  if (quiz[0].max_attempts > 0 && count >= quiz[0].max_attempts) {
    return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 403 })
  }
  
  // Check for active in-progress attempt
  const active = await sql`SELECT * FROM quiz_attempts WHERE quiz_id = ${params.id} AND student_id = ${userId} AND status = 'in_progress' LIMIT 1`
  if (active[0]) return NextResponse.json({ data: active[0], resumed: true })
  
  // Create new attempt
  const attempt = await sql`
    INSERT INTO quiz_attempts (quiz_id, student_id, attempt_number, status, started_at)
    VALUES (${params.id}, ${userId}, ${count + 1}, 'in_progress', NOW())
    RETURNING *`
  return NextResponse.json({ data: attempt[0], resumed: false })
}
