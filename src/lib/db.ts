import { neon } from '@neondatabase/serverless'

let _sql: ReturnType<typeof neon> | null = null

function getDb() {
  if (!process.env.DATABASE_URL) {
    // Return a no-op during build time
    return null
  }
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL)
  }
  return _sql
}

export async function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
  const db = getDb()
  if (!db) return []
  return db(strings, ...values) as Promise<any[]>
}
