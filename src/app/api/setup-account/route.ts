export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET — validate token and return invitation details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const invitations = await sql`
    SELECT i.id, i.email, i.full_name, i.status, i.expires_at, i.course_id,
      c.title as course_title, c.slug as course_slug
    FROM invitations i
    LEFT JOIN courses c ON i.course_id = c.id
    WHERE i.token = ${token}
    LIMIT 1
  `
  const inv = invitations[0]

  if (!inv) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (inv.status === 'accepted') return NextResponse.json({ error: 'Already activated' }, { status: 400 })
  if (new Date(inv.expires_at) < new Date()) {
    await sql`UPDATE invitations SET status = 'expired' WHERE id = ${inv.id}`
    return NextResponse.json({ error: 'Token expired' }, { status: 400 })
  }

  return NextResponse.json({ data: inv })
}

// POST — create account, enroll, mark invitation accepted
export async function POST(request: NextRequest) {
  const { token, full_name, password } = await request.json()
  if (!token || !password) return NextResponse.json({ error: 'Token and password required' }, { status: 400 })

  const invitations = await sql`
    SELECT * FROM invitations WHERE token = ${token} AND status = 'pending' LIMIT 1
  `
  const inv = invitations[0]
  if (!inv) return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
  if (new Date(inv.expires_at) < new Date()) return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const hash = bcrypt.hashSync(password, 10)

  // Check if user already exists (e.g. was enrolled in another course before)
  const existing = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${inv.email}) LIMIT 1`

  let userId: string

  if (existing[0]) {
    userId = existing[0].id
    // Update name and make active
    await sql`UPDATE users SET full_name = ${full_name || inv.full_name || ''}, password_hash = ${hash}, is_active = true, email_verified = true WHERE id = ${userId}`
  } else {
    // Create new user
    const newUser = await sql`
      INSERT INTO users (email, full_name, password_hash, role, is_active, email_verified)
      VALUES (${inv.email.toLowerCase()}, ${full_name || inv.full_name || ''}, ${hash}, 'student', true, true)
      RETURNING id
    `
    userId = newUser[0].id
  }

  // Enroll in course
  if (inv.course_id) {
    await sql`
      INSERT INTO enrollments (student_id, course_id, status)
      VALUES (${userId}, ${inv.course_id}, 'active')
      ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'
    `
    await sql`UPDATE courses SET total_students = (SELECT COUNT(*) FROM enrollments WHERE course_id = ${inv.course_id}) WHERE id = ${inv.course_id}`
    
    const course = await sql`SELECT title FROM courses WHERE id = ${inv.course_id} LIMIT 1`
    await sql`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (${userId}, '🎉 Welcome to BloomyLMS!', ${'You are enrolled in ' + (course[0]?.title || 'your course') + '. Start learning now!'}, 'success', '/dashboard')
    `
  }

  // Mark invitation accepted
  await sql`UPDATE invitations SET status = 'accepted', user_id = ${userId}, accepted_at = NOW() WHERE id = ${inv.id}`

  return NextResponse.json({ data: { success: true, email: inv.email } })
}
