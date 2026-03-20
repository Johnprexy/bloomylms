export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const checks: any = {
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL ? 'SET ✓' : 'MISSING ✗',
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET ? 'SET ✓' : 'MISSING ✗',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING ✗',
      NODE_ENV: process.env.NODE_ENV,
    },
    db: 'not tested',
    users: [],
  }

  if (process.env.DATABASE_URL) {
    try {
      const result = await sql`SELECT COUNT(*) as n FROM users`
      checks.db = `Connected ✓ — ${result[0]?.n} users`
      
      const users = await sql`
        SELECT email, role, is_active,
          CASE WHEN password_hash IS NOT NULL THEN 'has hash' ELSE 'NO HASH' END as pw
        FROM users LIMIT 10
      `
      checks.users = users
    } catch (e: any) {
      checks.db = `Error: ${e.message}`
    }
  }

  return NextResponse.json(checks, { status: 200 })
}
