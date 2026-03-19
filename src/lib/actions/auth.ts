'use server'

import bcrypt from 'bcryptjs'
import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export async function signUp(data: {
  email: string
  password: string
  full_name: string
  course_interest?: string
}) {
  const { email, password, full_name } = data

  if (!email || !password || !full_name) {
    return { error: 'All fields are required' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
    if (existing.length > 0) {
      return { error: 'An account with this email already exists' }
    }

    const password_hash = await bcrypt.hash(password, 12)

    await sql`
      INSERT INTO users (email, full_name, password_hash, role, email_verified)
      VALUES (${email}, ${full_name}, ${password_hash}, 'student', false)
    `

    return { success: true }
  } catch (err: any) {
    console.error('Sign up error:', err)
    return { error: 'Failed to create account. Please try again.' }
  }
}

export async function resetPassword(email: string) {
  try {
    const users = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
    if (users.length === 0) {
      // Don't reveal if email exists
      return { success: true }
    }

    const token = crypto.randomUUID()
    const expiry = new Date(Date.now() + 3600 * 1000) // 1 hour

    await sql`
      UPDATE users SET reset_token = ${token}, reset_token_expiry = ${expiry}
      WHERE email = ${email}
    `

    // Send reset email (import from email lib)
    const { sendPasswordResetEmail } = await import('@/lib/email')
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    await sendPasswordResetEmail(email, resetUrl)

    return { success: true }
  } catch (err) {
    console.error('Reset password error:', err)
    return { error: 'Failed to send reset email' }
  }
}

export async function updatePassword(token: string, newPassword: string) {
  try {
    const users = await sql`
      SELECT id FROM users
      WHERE reset_token = ${token}
      AND reset_token_expiry > NOW()
      LIMIT 1
    `
    if (users.length === 0) {
      return { error: 'Invalid or expired reset token' }
    }

    const password_hash = await bcrypt.hash(newPassword, 12)
    await sql`
      UPDATE users
      SET password_hash = ${password_hash}, reset_token = NULL, reset_token_expiry = NULL
      WHERE id = ${users[0].id}
    `

    return { success: true }
  } catch {
    return { error: 'Failed to update password' }
  }
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  try {
    const users = await sql`
      SELECT id, email, full_name, avatar_url, role, phone, bio, location,
             linkedin_url, github_url, is_active, onboarding_completed, created_at
      FROM users WHERE id = ${(session.user as any).id} LIMIT 1
    `
    return users[0] || null
  } catch {
    return null
  }
}

export async function updateProfile(data: Record<string, any>) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: 'Not authenticated' }

  const userId = (session.user as any).id
  const allowed = ['full_name', 'phone', 'bio', 'location', 'linkedin_url', 'github_url', 'avatar_url', 'onboarding_completed']
  const fields = Object.entries(data).filter(([k]) => allowed.includes(k))

  if (fields.length === 0) return { error: 'No valid fields' }

  try {
    const setClauses = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ')
    const values = fields.map(([, v]) => v)

    // Use tagged template for safety
    await sql`
      UPDATE users SET full_name = ${data.full_name || null},
        phone = ${data.phone || null}, bio = ${data.bio || null},
        location = ${data.location || null}, linkedin_url = ${data.linkedin_url || null},
        github_url = ${data.github_url || null},
        onboarding_completed = ${data.onboarding_completed ?? false},
        updated_at = NOW()
      WHERE id = ${userId}
    `
    return { success: true }
  } catch (err) {
    return { error: 'Failed to update profile' }
  }
}
