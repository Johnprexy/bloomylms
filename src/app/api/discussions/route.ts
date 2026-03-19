import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  const lesson_id = searchParams.get('lesson_id')

  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const supabase = await createClient()
  let query = supabase
    .from('discussions')
    .select('*, author:profiles(full_name, avatar_url)')
    .eq('course_id', course_id)
    .is('parent_id', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (lesson_id) query = query.eq('lesson_id', lesson_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { course_id, lesson_id, content, parent_id } = await request.json()
  if (!course_id || !content?.trim()) return NextResponse.json({ error: 'course_id and content required' }, { status: 400 })

  const { data, error } = await supabase
    .from('discussions')
    .insert({ course_id, lesson_id, author_id: user.id, content: content.trim(), parent_id: parent_id || null })
    .select('*, author:profiles(full_name, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
