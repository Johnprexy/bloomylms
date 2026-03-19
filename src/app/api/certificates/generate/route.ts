import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createAdminClient()
  const { enrollment_id } = await request.json()

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select(`*, course:courses(certificate_enabled, title), student:profiles(full_name)`)
    .eq('id', enrollment_id)
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  if (enrollment.status !== 'completed') return NextResponse.json({ error: 'Course not completed' }, { status: 400 })
  if (!(enrollment.course as any).certificate_enabled) return NextResponse.json({ error: 'No certificate for this course' }, { status: 400 })

  // Check if certificate already exists
  const { data: existing } = await supabase
    .from('certificates')
    .select('id')
    .eq('enrollment_id', enrollment_id)
    .single()

  if (existing) return NextResponse.json({ data: existing })

  const { data: cert, error } = await supabase
    .from('certificates')
    .insert({
      enrollment_id,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      status: 'issued',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify student
  await supabase.from('notifications').insert({
    user_id: enrollment.student_id,
    title: '🏆 Certificate Issued!',
    message: `Congratulations! Your certificate for "${(enrollment.course as any).title}" is ready.`,
    type: 'success',
    link: '/dashboard/certificates',
  })

  return NextResponse.json({ data: cert })
}
