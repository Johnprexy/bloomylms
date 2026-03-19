export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const data = await sql`SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`
  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { id, mark_all } = await request.json()
  if (mark_all) {
    await sql`UPDATE notifications SET read = true WHERE user_id = ${userId}`
  } else if (id) {
    await sql`UPDATE notifications SET read = true WHERE id = ${id} AND user_id = ${userId}`
  }
  return NextResponse.json({ success: true })
}
