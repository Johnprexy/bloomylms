export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'

function isAdmin(r: string) { return ['admin','super_admin','instructor'].includes(r) }

function calcLetterGrade(pct: number): string {
  if (pct >= 90) return 'A'
  if (pct >= 80) return 'B'
  if (pct >= 70) return 'C'
  if (pct >= 60) return 'D'
  return 'F'
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cohort_id = searchParams.get('cohort_id')
  const course_id = searchParams.get('course_id')
  const student_id = searchParams.get('student_id')

  // Load filter options
  const [cohorts, courses] = await Promise.all([
    sql`SELECT co.id, co.name, c.id as course_id, c.title as course_title
        FROM cohorts co JOIN courses c ON co.course_id = c.id ORDER BY co.name`,
    sql`SELECT id, title FROM courses WHERE status = 'published' ORDER BY title`,
  ])

  if (!cohort_id && !course_id) {
    return NextResponse.json({ cohorts, courses, data: [] })
  }

  // Build student list
  let students: any[]
  if (student_id) {
    students = await sql`SELECT u.id, u.email, u.full_name FROM users u WHERE u.id = ${student_id} LIMIT 1`
  } else if (cohort_id && course_id) {
    students = await sql`
      SELECT u.id, u.email, u.full_name FROM cohort_students cs
      JOIN users u ON cs.student_id = u.id
      JOIN enrollments e ON e.student_id = u.id AND e.course_id = ${course_id}
      WHERE cs.cohort_id = ${cohort_id} AND u.is_active = true
      ORDER BY u.full_name
    `
  } else if (cohort_id) {
    students = await sql`
      SELECT DISTINCT u.id, u.email, u.full_name FROM cohort_students cs
      JOIN users u ON cs.student_id = u.id
      WHERE cs.cohort_id = ${cohort_id} AND u.is_active = true
      ORDER BY u.full_name
    `
  } else {
    students = await sql`
      SELECT u.id, u.email, u.full_name FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.course_id = ${course_id} AND u.is_active = true
      ORDER BY u.full_name
    `
  }

  if (!students.length) return NextResponse.json({ cohorts, courses, data: [], items: [] })

  // Get grade items for the course(s)
  let items: any[]
  if (course_id) {
    items = await sql`SELECT * FROM grade_items WHERE course_id = ${course_id} ORDER BY position, created_at`
  } else if (cohort_id) {
    const cohortRow = cohorts.find((c: any) => c.id === cohort_id)
    if (cohortRow) {
      items = await sql`SELECT * FROM grade_items WHERE course_id = ${cohortRow.course_id} ORDER BY position, created_at`
    } else items = []
  } else items = []

  // Get all grades for these students
  const studentIds = students.map((s: any) => s.id)
  const allGrades = items.length > 0 ? await sql`
    SELECT g.*, gi.category, gi.max_score, gi.weight_percent
    FROM grades g
    JOIN grade_items gi ON g.grade_item_id = gi.id
    WHERE gi.id IN (SELECT id FROM grade_items WHERE course_id = ${course_id || cohorts.find((c: any) => c.id === cohort_id)?.course_id})
    AND g.student_id IN (SELECT unnest(${studentIds}::uuid[]))
  ` : []

  // Build per-student summary
  const data = students.map((student: any) => {
    const studentGrades = allGrades.filter((g: any) => g.student_id === student.id)
    const gradeMap: Record<string, number | null> = {}
    items.forEach((item: any) => {
      const g = studentGrades.find((sg: any) => sg.grade_item_id === item.id)
      gradeMap[item.id] = g ? Number(g.score) : null
    })

    // Calculate totals by category
    const byCategory: Record<string, { scores: number[], maxes: number[], weights: number[] }> = {}
    items.forEach((item: any) => {
      const score = gradeMap[item.id]
      if (score === null) return
      if (!byCategory[item.category]) byCategory[item.category] = { scores: [], maxes: [], weights: [] }
      byCategory[item.category].scores.push(score)
      byCategory[item.category].maxes.push(Number(item.max_score))
      byCategory[item.category].weights.push(Number(item.weight_percent))
    })

    const totalWeight = items.reduce((s: number, i: any) => s + Number(i.weight_percent), 0)
    let finalScore: number | null = null

    if (totalWeight > 0) {
      const weighted = items.reduce((s: number, item: any) => {
        const score = gradeMap[item.id]
        if (score === null) return s
        return s + (score / Number(item.max_score)) * Number(item.weight_percent)
      }, 0)
      finalScore = weighted
    } else {
      const validScores = Object.values(gradeMap).filter(v => v !== null) as number[]
      const validItems = items.filter((i: any) => gradeMap[i.id] !== null)
      if (validScores.length > 0) {
        finalScore = validScores.reduce((s, v, idx) => s + (v / Number(validItems[idx]?.max_score || 100)) * 100, 0) / validScores.length
      }
    }

    // Category averages
    const categoryAvg: Record<string, number | null> = {}
    for (const [cat, data] of Object.entries(byCategory)) {
      if (!data.scores.length) { categoryAvg[cat] = null; continue }
      const pct = data.scores.reduce((s, v, i) => s + (v / data.maxes[i]) * 100, 0) / data.scores.length
      categoryAvg[cat] = Math.round(pct * 10) / 10
    }

    return {
      student,
      grades: gradeMap,
      categoryAvg,
      finalScore: finalScore !== null ? Math.round(finalScore * 10) / 10 : null,
      letterGrade: finalScore !== null ? calcLetterGrade(finalScore) : null,
    }
  })

  return NextResponse.json({ cohorts, courses, items, data })
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !isAdmin((session.user as any).role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id
  const { grades } = await request.json()
  for (const g of grades) {
    await sql`
      INSERT INTO grades (grade_item_id, student_id, score, graded_by, graded_at)
      VALUES (${g.grade_item_id}, ${g.student_id}, ${g.score}, ${userId}, NOW())
      ON CONFLICT (grade_item_id, student_id) DO UPDATE SET score = EXCLUDED.score, graded_by = EXCLUDED.graded_by, graded_at = NOW()
    `
  }
  return NextResponse.json({ success: true })
}
