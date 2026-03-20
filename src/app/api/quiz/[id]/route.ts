export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  // Try by quiz id first, then by lesson_id
  let data = await sql`SELECT * FROM quizzes WHERE id = ${params.id} LIMIT 1`
  if (!data[0]) {
    data = await sql`SELECT * FROM quizzes WHERE lesson_id = ${params.id} LIMIT 1`
  }
  return NextResponse.json({ data: data[0] || null })
}
