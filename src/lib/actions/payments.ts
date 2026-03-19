'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function initializePaystackPayment(courseId: string, promoCode?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: course } = await supabase.from('courses').select('*').eq('id', courseId).single()
  if (!course) return { error: 'Course not found' }

  const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()

  let amount = course.price
  let discountAmount = 0

  if (promoCode) {
    const { data: promo } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (promo) {
      if (promo.discount_type === 'percent') {
        discountAmount = (amount * promo.discount_value) / 100
      } else {
        discountAmount = promo.discount_value
      }
      amount = Math.max(0, amount - discountAmount)
    }
  }

  // Create pending payment record
  const { data: payment } = await supabase
    .from('payments')
    .insert({
      student_id: user.id,
      course_id: courseId,
      amount,
      currency: course.currency,
      gateway: 'paystack',
      status: 'pending',
      promo_code: promoCode,
      discount_amount: discountAmount,
    })
    .select()
    .single()

  const paystackRef = `BT-${payment?.id?.slice(0, 8)}-${Date.now()}`

  await supabase.from('payments').update({ gateway_ref: paystackRef }).eq('id', payment?.id)

  return {
    data: {
      reference: paystackRef,
      email: profile?.email,
      amount: amount * 100, // Paystack expects kobo
      currency: course.currency,
      payment_id: payment?.id,
      course_name: course.title,
    }
  }
}

export async function verifyPaystackPayment(reference: string) {
  const supabase = await createClient()

  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })

  const result = await response.json()

  if (!result.status || result.data?.status !== 'success') {
    return { error: 'Payment verification failed' }
  }

  const { data: payment } = await supabase
    .from('payments')
    .update({ status: 'success', gateway_response: result.data })
    .eq('gateway_ref', reference)
    .select()
    .single()

  if (!payment) return { error: 'Payment record not found' }

  // Enroll student
  const { data: enrollment } = await supabase
    .from('enrollments')
    .upsert({
      student_id: payment.student_id,
      course_id: payment.course_id,
      status: 'active',
    })
    .select()
    .single()

  await supabase.from('payments').update({ enrollment_id: enrollment?.id }).eq('id', payment.id)

  // Update cohort count
  const { data: cohort } = await supabase
    .from('cohorts')
    .select('*')
    .eq('course_id', payment.course_id)
    .eq('is_open', true)
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

  if (cohort) {
    await supabase.from('cohorts').update({ enrolled_count: cohort.enrolled_count + 1 }).eq('id', cohort.id)
    await supabase.from('enrollments').update({ cohort_id: cohort.id }).eq('id', enrollment?.id)
  }

  // Send enrollment notification
  await supabase.from('notifications').insert({
    user_id: payment.student_id,
    title: 'Enrollment Confirmed! 🎉',
    message: 'You have successfully enrolled. Start learning now!',
    type: 'success',
    link: `/dashboard`,
  })

  revalidatePath('/dashboard')
  return { data: { enrollment_id: enrollment?.id } }
}

export async function getAdminStats() {
  const supabase = await createClient()

  const [students, instructors, courses, payments, enrollments] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'instructor'),
    supabase.from('courses').select('id', { count: 'exact' }).eq('status', 'published'),
    supabase.from('payments').select('amount, created_at').eq('status', 'success'),
    supabase.from('enrollments').select('id', { count: 'exact' }).eq('status', 'active'),
  ])

  const totalRevenue = payments.data?.reduce((s, p) => s + p.amount, 0) || 0

  // Monthly revenue last 6 months
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const month = d.toLocaleString('default', { month: 'short', year: '2-digit' })
    const revenue = payments.data?.filter(p => {
      const pd = new Date(p.created_at)
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear()
    }).reduce((s, p) => s + p.amount, 0) || 0
    return { month, revenue }
  }).reverse()

  return {
    data: {
      total_students: students.count || 0,
      total_instructors: instructors.count || 0,
      total_courses: courses.count || 0,
      total_revenue: totalRevenue,
      active_enrollments: enrollments.count || 0,
      monthly_revenue: monthlyRevenue,
    }
  }
}
