export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const queue = await sql`
    SELECT qa.id as attempt_id, qa.student_id, qa.quiz_id, qa.submitted_at, qa.auto_score,
      qa.attempt_number, u.full_name as student_name, u.email as student_email,
      q.title as quiz_title, c.title as course_title
    FROM quiz_attempts qa
    JOIN users u ON qa.student_id = u.id
    JOIN quizzes q ON qa.quiz_id = q.id
    LEFT JOIN courses c ON q.course_id = c.id
    WHERE qa.status = 'submitted'
    ORDER BY qa.submitted_at ASC`
  return NextResponse.json({ data: queue })
}
