'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function initializePaystackPayment(courseId: string, promoCode?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: 'Not authenticated' }
  const userId = (session.user as any).id

  const courses = await sql`SELECT * FROM courses WHERE id = ${courseId} LIMIT 1`
  const course = courses[0]
  if (!course) return { error: 'Course not found' }

  const users = await sql`SELECT email FROM users WHERE id = ${userId} LIMIT 1`
  const profile = users[0]

  let amount = Number(course.price)
  let discountAmount = 0

  if (promoCode) {
    const promos = await sql`SELECT * FROM promo_codes WHERE code = ${promoCode.toUpperCase()} AND is_active = true LIMIT 1`
    const promo = promos[0]
    if (promo) {
      discountAmount = promo.discount_type === 'percent' ? (amount * Number(promo.discount_value)) / 100 : Number(promo.discount_value)
      amount = Math.max(0, amount - discountAmount)
    }
  }

  const paystackRef = `BT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  await sql`
    INSERT INTO payments (student_id, course_id, amount, currency, gateway, gateway_ref, status, promo_code, discount_amount)
    VALUES (${userId}, ${courseId}, ${amount}, ${course.currency}, 'paystack', ${paystackRef}, 'pending', ${promoCode || null}, ${discountAmount})
  `

  return {
    data: {
      reference: paystackRef,
      email: profile?.email,
      amount: amount * 100,
      currency: course.currency,
      course_name: course.title,
    }
  }
}

export async function verifyPaystackPayment(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const result = await response.json()
  if (!result.status || result.data?.status !== 'success') return { error: 'Payment verification failed' }

  const payments = await sql`UPDATE payments SET status = 'success', gateway_response = ${JSON.stringify(result.data)} WHERE gateway_ref = ${reference} RETURNING *`
  const payment = payments[0]
  if (!payment) return { error: 'Payment not found' }

  const existing = await sql`SELECT id FROM enrollments WHERE student_id = ${payment.student_id} AND course_id = ${payment.course_id} LIMIT 1`
  if (!existing[0]) {
    const enrollment = await sql`INSERT INTO enrollments (student_id, course_id, status) VALUES (${payment.student_id}, ${payment.course_id}, 'active') RETURNING id`
    await sql`UPDATE payments SET enrollment_id = ${enrollment[0].id} WHERE id = ${payment.id}`
    await sql`UPDATE courses SET total_students = total_students + 1 WHERE id = ${payment.course_id}`
    await sql`INSERT INTO notifications (user_id, title, message, type, link) VALUES (${payment.student_id}, '🎉 Enrolled!', 'Payment confirmed. Start learning now!', 'success', '/dashboard')`
  }

  return { data: { success: true } }
}
