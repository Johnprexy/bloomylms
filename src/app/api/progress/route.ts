import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lesson_id, course_id, completed, watch_time_seconds } = await request.json()
  if (!lesson_id || !course_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await supabase
    .from('lesson_progress')
    .upsert({
      student_id: user.id,
      lesson_id,
      course_id,
      completed: completed ?? false,
      watch_time_seconds: watch_time_seconds ?? 0,
      ...(completed ? { completed_at: new Date().toISOString() } : {}),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check if course is now 100% complete and issue certificate
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, progress_percent, status')
    .eq('student_id', user.id)
    .eq('course_id', course_id)
    .single()

  if (enrollment?.status === 'completed' && enrollment.progress_percent >= 100) {
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('id')
      .eq('enrollment_id', enrollment.id)
      .single()

    if (!existingCert) {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/certificates/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollment.id }),
      })
    }
  }

  return NextResponse.json({ data })
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const course_id = searchParams.get('course_id')
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', user.id)
    .eq('course_id', course_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
