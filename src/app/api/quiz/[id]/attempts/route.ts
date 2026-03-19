export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user')
  if (!userId) return NextResponse.json({ data: [] })
  const data = await sql`SELECT * FROM quiz_attempts WHERE quiz_id = ${params.id} AND student_id = ${userId} ORDER BY started_at DESC`
  return NextResponse.json({ data })
}
