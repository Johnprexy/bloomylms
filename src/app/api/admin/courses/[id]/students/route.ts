export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isAdmin } from '@/lib/permissions'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await sql`
    SELECT e.id, e.enrolled_at, e.status, e.progress_percent,
      u.full_name, u.email
    FROM enrollments e
    JOIN users u ON e.student_id = u.id
    WHERE e.course_id = ${params.id}
    ORDER BY e.enrolled_at DESC`
  return NextResponse.json({ data })
}
