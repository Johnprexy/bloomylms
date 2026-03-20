export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'

function isAdmin(role: string) { return role === 'admin' || role === 'super_admin' }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [instructors, courses] = await Promise.all([
    sql`
      SELECT u.id, u.email, u.full_name, u.phone, u.bio, u.avatar_url, u.is_active, u.created_at,
        COUNT(DISTINCT c.id) as course_count,
        COALESCE(SUM(c.total_students), 0) as student_count,
        ROUND(AVG(c.average_rating) FILTER (WHERE c.average_rating > 0), 1) as avg_rating
      FROM users u
      LEFT JOIN courses c ON c.instructor_id = u.id
      WHERE u.role = 'instructor'
      GROUP BY u.id ORDER BY u.created_at DESC
    `,
    sql`SELECT id, title, slug, status, instructor_id FROM courses ORDER BY title`,
  ])

  return NextResponse.json({ instructors, courses })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { full_name, email, password, phone, bio, assigned_courses } = await request.json()
  if (!email || !password || !full_name) return NextResponse.json({ error: 'name, email and password required' }, { status: 400 })

  const existing = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
  if (existing[0]) {
    // If exists, just promote to instructor
    await sql`UPDATE users SET role = 'instructor', is_active = true WHERE id = ${existing[0].id}`
    if (assigned_courses?.length) {
      for (const courseId of assigned_courses) {
        await sql`UPDATE courses SET instructor_id = ${existing[0].id} WHERE id = ${courseId}`
      }
    }
    const user = await sql`SELECT * FROM users WHERE id = ${existing[0].id} LIMIT 1`
    return NextResponse.json({ data: user[0] })
  }

  const hash = bcrypt.hashSync(password, 10)
  const user = await sql`
    INSERT INTO users (email, full_name, password_hash, role, phone, bio, is_active, email_verified)
    VALUES (${email.toLowerCase()}, ${full_name}, ${hash}, 'instructor', ${phone || null}, ${bio || null}, true, true)
    RETURNING id, email, full_name, role, phone, bio, created_at
  `

  if (assigned_courses?.length) {
    for (const courseId of assigned_courses) {
      await sql`UPDATE courses SET instructor_id = ${user[0].id} WHERE id = ${courseId}`
    }
  }

  // Send welcome notification
  await sql`INSERT INTO notifications (user_id, title, message, type) VALUES (${user[0].id}, '👋 Welcome to BloomyLMS!', 'Your instructor account is ready. Start building your courses!', 'info')`

  return NextResponse.json({ data: user[0] })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { instructor_id, course_id } = await request.json()
  await sql`UPDATE courses SET instructor_id = ${instructor_id} WHERE id = ${course_id}`
  return NextResponse.json({ success: true })
}
