export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Survey ID required' }, { status: 400 })

  const surveys = await sql`SELECT * FROM surveys WHERE id = ${id} AND is_active = true LIMIT 1`
  if (!surveys[0]) return NextResponse.json({ error: 'Survey not found or no longer active' }, { status: 404 })

  const questions = await sql`SELECT * FROM survey_questions WHERE survey_id = ${id} ORDER BY position`
  return NextResponse.json({ survey: surveys[0], questions })
}

export async function POST(request: NextRequest) {
  const { survey_id, answers } = await request.json()
  if (!survey_id || !answers) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const survey = await sql`SELECT is_anonymous FROM surveys WHERE id = ${survey_id} AND is_active = true LIMIT 1`
  if (!survey[0]) return NextResponse.json({ error: 'Survey not found or no longer active' }, { status: 404 })

  await sql`
    INSERT INTO survey_responses (survey_id, student_id, answers)
    VALUES (${survey_id}, null, ${JSON.stringify(answers)})
  `
  return NextResponse.json({ success: true })
}
