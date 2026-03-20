import { neon } from '@neondatabase/serverless'

// Neon's tagged template function
// neon() returns a function that works as a tagged template: db`SELECT ...`
// We wrap it so we can handle the missing DATABASE_URL case at build time

let _db: ((...args: any[]) => Promise<any[]>) | null = null

function getDb() {
  if (!process.env.DATABASE_URL) return null
  if (!_db) {
    _db = neon(process.env.DATABASE_URL) as any
  }
  return _db
}

// sql tagged template — use exactly like: const rows = await sql`SELECT * FROM users`
export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
  const db = getDb()
  if (!db) return Promise.resolve([])
  // neon tagged template: db`SELECT * FROM users WHERE id = ${id}`
  // is called internally as db(strings, ...values)
  return db(strings, ...values) as Promise<any[]>
}
