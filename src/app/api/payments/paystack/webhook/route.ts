export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-paystack-signature')
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '').update(body).digest('hex')
  if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const event = JSON.parse(body)
  if (event.event !== 'charge.success') return NextResponse.json({ received: true })

  const { reference, status } = event.data
  if (status !== 'success') return NextResponse.json({ received: true })

  const payments = await sql`UPDATE payments SET status = 'success', gateway_response = ${JSON.stringify(event.data)} WHERE gateway_ref = ${reference} RETURNING *`
  const payment = payments[0]
  if (!payment) return NextResponse.json({ received: true })

  const existing = await sql`SELECT id FROM enrollments WHERE student_id = ${payment.student_id} AND course_id = ${payment.course_id} LIMIT 1`
  if (!existing[0]) {
    const enrollment = await sql`INSERT INTO enrollments (student_id, course_id, status) VALUES (${payment.student_id}, ${payment.course_id}, 'active') RETURNING id`
    await sql`UPDATE payments SET enrollment_id = ${enrollment[0].id} WHERE id = ${payment.id}`
    await sql`UPDATE courses SET total_students = total_students + 1 WHERE id = ${payment.course_id}`
    await sql`INSERT INTO notifications (user_id, title, message, type, link) VALUES (${payment.student_id}, '🎉 Payment Confirmed!', 'Your enrollment is confirmed. Start learning now!', 'success', '/dashboard')`
  }
  return NextResponse.json({ received: true })
}
