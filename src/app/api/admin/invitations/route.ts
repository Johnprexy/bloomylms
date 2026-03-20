export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { sendInvitationEmail } from '@/lib/email'
import crypto from 'crypto'

function isAdmin(role: string) { return role === 'admin' || role === 'super_admin' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await sql`
    SELECT i.id, i.email, i.full_name, i.status, i.created_at, i.expires_at, i.accepted_at,
      c.title as course_title, c.slug as course_slug
    FROM invitations i
    LEFT JOIN courses c ON i.course_id = c.id
    ORDER BY i.created_at DESC
    LIMIT 200
  `
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminId = (session.user as any).id
  const rows = await request.json() as { email: string; full_name?: string; course_id: string }[]

  if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

  let sent = 0, skipped = 0
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bloomylms.vercel.app'

  for (const row of rows) {
    const email = row.email?.toLowerCase().trim()
    if (!email || !row.course_id) { skipped++; continue }

    // Check if already a confirmed user enrolled in this course
    const existingUser = await sql`SELECT id FROM users WHERE LOWER(email) = ${email} AND is_active = true LIMIT 1`
    if (existingUser[0]) {
      const enrolled = await sql`SELECT id FROM enrollments WHERE student_id = ${existingUser[0].id} AND course_id = ${row.course_id} LIMIT 1`
      if (enrolled[0]) { skipped++; continue }
      // User exists but not enrolled — just enroll them
      await sql`INSERT INTO enrollments (student_id, course_id, status) VALUES (${existingUser[0].id}, ${row.course_id}, 'active') ON CONFLICT DO NOTHING`
      await sql`UPDATE courses SET total_students = total_students + 1 WHERE id = ${row.course_id}`
      await sql`INSERT INTO notifications (user_id, title, message, type, link) VALUES (${existingUser[0].id}, '🎉 New course enrolled!', 'You have been enrolled in a new course by an admin.', 'success', '/dashboard')`
      sent++; continue
    }

    // Check for pending invitation for same email+course
    const existingInv = await sql`SELECT id FROM invitations WHERE LOWER(email) = ${email} AND course_id = ${row.course_id} AND status = 'pending' LIMIT 1`
    if (existingInv[0]) { skipped++; continue }

    const token = crypto.randomBytes(32).toString('hex')
    const courseName = await sql`SELECT title FROM courses WHERE id = ${row.course_id} LIMIT 1`

    await sql`
      INSERT INTO invitations (email, full_name, course_id, token, status, invited_by, expires_at)
      VALUES (${email}, ${row.full_name || ''}, ${row.course_id}, ${token}, 'pending', ${adminId}, NOW() + INTERVAL '48 hours')
    `

    const setupUrl = `${appUrl}/setup-account?token=${token}`
    await sendInvitationEmail(email, row.full_name || '', courseName[0]?.title || 'your course', setupUrl)
    sent++
  }

  return NextResponse.json({ data: { sent, skipped } })
}

// PATCH — resend invitation
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const invitations = await sql`SELECT * FROM invitations WHERE id = ${id} LIMIT 1`
  const inv = invitations[0]
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Refresh token + expiry
  const token = crypto.randomBytes(32).toString('hex')
  await sql`UPDATE invitations SET token = ${token}, status = 'pending', expires_at = NOW() + INTERVAL '48 hours' WHERE id = ${id}`

  const courseName = await sql`SELECT title FROM courses WHERE id = ${inv.course_id} LIMIT 1`
  const appUrl = process.env.NEXTAUTH_URL || 'https://bloomylms.vercel.app'
  const setupUrl = `${appUrl}/setup-account?token=${token}`
  await sendInvitationEmail(inv.email, inv.full_name || '', courseName[0]?.title || 'your course', setupUrl)

  return NextResponse.json({ success: true })
}

// DELETE — remove invitation
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await sql`DELETE FROM invitations WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
