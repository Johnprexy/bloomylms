export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const data = await sql`
    SELECT m.id, m.title, m.position,
      json_agg(json_build_object('id',l.id,'title',l.title,'type',l.type,'video_url',l.video_url,'content',l.content,'position',l.position) ORDER BY l.position) FILTER (WHERE l.id IS NOT NULL) as lessons
    FROM modules m LEFT JOIN lessons l ON l.module_id = m.id
    WHERE m.course_id = ${params.id} GROUP BY m.id ORDER BY m.position`
  return NextResponse.json({ data })
}
