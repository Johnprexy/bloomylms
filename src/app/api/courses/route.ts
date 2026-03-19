import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const difficulty = searchParams.get('difficulty') || ''
  const limit = parseInt(searchParams.get('limit') || '12')
  const page = parseInt(searchParams.get('page') || '1')
  const offset = (page - 1) * limit

  const supabase = await createClient()
  let query = supabase
    .from('courses')
    .select(`*, category:categories(name, icon, slug), instructor:profiles(full_name)`, { count: 'exact' })
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('total_students', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) query = query.ilike('title', `%${q}%`)
  if (difficulty) query = query.eq('difficulty', difficulty)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    total: count || 0,
    page,
    limit,
    has_more: (count || 0) > offset + limit,
  })
}
