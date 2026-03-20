export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isAdmin } from '@/lib/permissions'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const d = await req.json()
  await sql`
    UPDATE courses SET
      title = ${d.title}, short_description = ${d.short_description || null},
      description = ${d.description || ''}, instructor_id = ${d.instructor_id},
      category_id = ${d.category_id || null}, price = ${d.price || 0},
      difficulty = ${d.difficulty || 'beginner'}, duration_weeks = ${d.duration_weeks || 12},
      thumbnail_url = ${d.thumbnail_url || null}, updated_at = NOW()
    WHERE id = ${params.id}`
  return NextResponse.json({ success: true })
}
