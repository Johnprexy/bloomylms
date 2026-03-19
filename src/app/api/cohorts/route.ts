export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  let data
  if (course_id) {
    data = await sql`SELECT co.*, c.title as course_title FROM cohorts co JOIN courses c ON co.course_id = c.id WHERE co.course_id = ${course_id} ORDER BY co.start_date DESC`
  } else {
    data = await sql`SELECT co.*, c.title as course_title FROM cohorts co JOIN courses c ON co.course_id = c.id ORDER BY co.start_date DESC`
  }
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { course_id, name, start_date, end_date, max_students } = await request.json()
  const data = await sql`INSERT INTO cohorts (course_id, name, start_date, end_date, max_students, is_open) VALUES (${course_id}, ${name}, ${start_date}, ${end_date || null}, ${max_students || 50}, true) RETURNING *`
  return NextResponse.json({ data: data[0] })
}
