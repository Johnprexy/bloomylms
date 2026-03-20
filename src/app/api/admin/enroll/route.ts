export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function isAdmin(role: string) { return role === 'admin' || role === 'super_admin' }

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await request.json() as { email: string; full_name?: string; course_id: string }[]
  if (!rows?.length) return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  const results: { email: string; status: string; message: string }[] = []
  const appUrl = process.env.NEXTAUTH_URL || 'https://bloomylms.vercel.app'

  for (const row of rows) {
    const email = row.email?.toLowerCase().trim()
    if (!email || !row.course_id) {
      results.push({ email: email || '?', status: 'skipped', message: 'Missing email or course' })
      continue
    }

    // Check course exists
    const course = await sql`SELECT id, title FROM courses WHERE id = ${row.course_id} LIMIT 1`
    if (!course[0]) {
      results.push({ email, status: 'error', message: 'Course not found' })
      continue
    }

    // Check if user exists
    const existing = await sql`SELECT id, full_name, role FROM users WHERE LOWER(email) = ${email} LIMIT 1`

    let userId: string

    if (existing[0]) {
      userId = existing[0].id
      // Check already enrolled
      const enrolled = await sql`SELECT id FROM enrollments WHERE student_id = ${userId} AND course_id = ${row.course_id} LIMIT 1`
      if (enrolled[0]) {
        results.push({ email, status: 'skipped', message: `Already enrolled in ${course[0].title}` })
        continue
      }
    } else {
      // Create new user account with temporary password
      const tempPassword = crypto.randomBytes(4).toString('hex').toUpperCase() // e.g. A1B2C3D4
      const hash = await bcrypt.hash(tempPassword, 10)
      const fullName = row.full_name?.trim() || email.split('@')[0]

      const newUser = await sql`
        INSERT INTO users (email, full_name, password_hash, role, is_active, email_verified)
        VALUES (${email}, ${fullName}, ${hash}, 'student', true, true)
        RETURNING id
      `
      userId = newUser[0].id

      // Store temp password in invitation for display to admin
      await sql`
        INSERT INTO invitations (email, full_name, course_id, token, status, invited_by, expires_at)
        VALUES (${email}, ${fullName}, ${row.course_id}, ${tempPassword}, 'pending', ${(session.user as any).id}, NOW() + INTERVAL '30 days')
        ON CONFLICT DO NOTHING
      `

      results.push({
        email,
        status: 'created',
        message: `Account created. Temp password: ${tempPassword}`,
      })
    }

    // Enroll in course
    await sql`
      INSERT INTO enrollments (student_id, course_id, status)
      VALUES (${userId}, ${row.course_id}, 'active')
      ON CONFLICT DO NOTHING
    `
    await sql`UPDATE courses SET total_students = COALESCE(total_students,0) + 1 WHERE id = ${row.course_id}`

    // Try send email (best-effort, won't block on failure)
    try {
      const { sendInvitationEmail } = await import('@/lib/email')
      const setupUrl = `${appUrl}/login`
      await sendInvitationEmail(email, row.full_name || '', course[0].title, setupUrl)
    } catch (_) { /* email optional */ }

    if (!existing[0]) {
      // already pushed created message above
    } else {
      results.push({ email, status: 'enrolled', message: `Enrolled in ${course[0].title}` })
    }
  }

  const enrolled = results.filter(r => r.status === 'enrolled' || r.status === 'created').length
  const created  = results.filter(r => r.status === 'created').length
  const skipped  = results.filter(r => r.status === 'skipped').length
  const errors   = results.filter(r => r.status === 'error').length

  return NextResponse.json({ data: { enrolled, created, skipped, errors, results } })
}
