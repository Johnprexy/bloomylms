import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { course_id, rating, comment } = await request.json()
  if (!course_id || !rating) return NextResponse.json({ error: 'course_id and rating required' }, { status: 400 })
  if (rating < 1 || rating > 5) return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })

  // Verify enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', course_id)
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Must be enrolled to review' }, { status: 403 })

  const { data, error } = await supabase
    .from('reviews')
    .upsert({ course_id, student_id: user.id, rating, comment })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculate course average rating
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('course_id', course_id)

  if (allReviews) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await supabase.from('courses').update({
      average_rating: Math.round(avg * 10) / 10,
      total_reviews: allReviews.length,
    }).eq('id', course_id)
  }

  return NextResponse.json({ data })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('*, student:profiles(full_name, avatar_url)')
    .eq('course_id', course_id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ data })
}
