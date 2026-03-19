export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  const lesson_id = searchParams.get('lesson_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })
  let data
  if (lesson_id) {
    data = await sql`SELECT d.*, u.full_name, u.avatar_url FROM discussions d JOIN users u ON d.author_id = u.id WHERE d.course_id = ${course_id} AND d.lesson_id = ${lesson_id} AND d.parent_id IS NULL ORDER BY d.is_pinned DESC, d.created_at DESC`
  } else {
    data = await sql`SELECT d.*, u.full_name, u.avatar_url FROM discussions d JOIN users u ON d.author_id = u.id WHERE d.course_id = ${course_id} AND d.parent_id IS NULL ORDER BY d.is_pinned DESC, d.created_at DESC`
  }
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { course_id, lesson_id, content, parent_id } = await request.json()
  if (!course_id || !content?.trim()) return NextResponse.json({ error: 'course_id and content required' }, { status: 400 })
  const data = await sql`INSERT INTO discussions (course_id, lesson_id, author_id, content, parent_id) VALUES (${course_id}, ${lesson_id || null}, ${userId}, ${content.trim()}, ${parent_id || null}) RETURNING *`
  return NextResponse.json({ data: data[0] })
}
