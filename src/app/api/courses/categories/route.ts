export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
export async function GET() {
  const data = await sql`SELECT * FROM categories ORDER BY name`
  return NextResponse.json({ data })
}
