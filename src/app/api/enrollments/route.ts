import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  // Verify course is free
  const { data: course } = await supabase.from('courses').select('price, status').eq('id', course_id).single()
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
  if (course.status !== 'published') return NextResponse.json({ error: 'Course not available' }, { status: 400 })
  if (course.price > 0) return NextResponse.json({ error: 'This course requires payment' }, { status: 400 })

  // Check existing enrollment
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', course_id)
    .single()

  if (existing) return NextResponse.json({ data: { enrollment_id: existing.id } })

  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .insert({ student_id: user.id, course_id, status: 'active' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Free payment record for tracking
  await supabase.from('payments').insert({
    student_id: user.id,
    course_id,
    enrollment_id: enrollment.id,
    amount: 0,
    currency: 'NGN',
    gateway: 'manual',
    status: 'success',
  })

  // Welcome notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: '🎉 Enrolled Successfully!',
    message: 'You\'ve been enrolled. Start your learning journey now!',
    type: 'success',
    link: '/dashboard',
  })

  return NextResponse.json({ data: { enrollment_id: enrollment.id } })
}
