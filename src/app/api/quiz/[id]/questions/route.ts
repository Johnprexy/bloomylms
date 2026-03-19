export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const data = await sql`SELECT * FROM quiz_questions WHERE quiz_id = ${params.id} ORDER BY position`
  return NextResponse.json({ data })
}
