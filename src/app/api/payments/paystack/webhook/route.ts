import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const supabase = await createAdminClient()

  if (event.event === 'charge.success') {
    const { reference, status } = event.data

    if (status !== 'success') return NextResponse.json({ received: true })

    // Update payment
    const { data: payment } = await supabase
      .from('payments')
      .update({ status: 'success', gateway_response: event.data })
      .eq('gateway_ref', reference)
      .select()
      .single()

    if (!payment) return NextResponse.json({ received: true })

    // Create enrollment if not exists
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', payment.student_id)
      .eq('course_id', payment.course_id)
      .single()

    if (!existing) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .insert({ student_id: payment.student_id, course_id: payment.course_id, status: 'active' })
        .select()
        .single()

      await supabase.from('payments').update({ enrollment_id: enrollment?.id }).eq('id', payment.id)

      await supabase.from('notifications').insert({
        user_id: payment.student_id,
        title: '🎉 Payment Confirmed!',
        message: 'Your enrollment is confirmed. Start learning now!',
        type: 'success',
        link: '/dashboard',
      })
    }
  }

  return NextResponse.json({ received: true })
}
