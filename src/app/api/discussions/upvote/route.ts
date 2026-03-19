export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
export async function POST(request: NextRequest) {
  const { id } = await request.json()
  await sql`UPDATE discussions SET upvotes = upvotes + 1 WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
