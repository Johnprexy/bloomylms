import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let _db: NeonQueryFunction<false, false> | null = null

function getDb(): NeonQueryFunction<false, false> | null {
  if (!process.env.DATABASE_URL) return null
  if (!_db) _db = neon(process.env.DATABASE_URL)
  return _db
}

// This is the sql tagged template function used everywhere in the app
// Usage: await sql`SELECT * FROM users WHERE id = ${userId}`
export async function sql(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<any[]> {
  const db = getDb()
  if (!db) return []
  const result = await db(strings, ...values)
  return result as any[]
}
