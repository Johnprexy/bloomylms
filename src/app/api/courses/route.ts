export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const difficulty = searchParams.get('difficulty') || ''
  const category = searchParams.get('category') || ''
  try {
    let query = `SELECT c.*, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id WHERE c.status = 'published'`
    const params: any[] = []
    let i = 1
    if (q) { query += ` AND c.title ILIKE $${i++}`; params.push(`%${q}%`) }
    if (difficulty) { query += ` AND c.difficulty = $${i++}`; params.push(difficulty) }
    if (category) { query += ` AND cat.slug = $${i++}`; params.push(category) }
    query += ' ORDER BY c.is_featured DESC, c.total_students DESC LIMIT 50'
    const data = await sql(query as any, params as any)
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
