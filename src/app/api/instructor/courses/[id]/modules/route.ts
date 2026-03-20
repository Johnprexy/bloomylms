export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Try with all columns first
    const data = await sql`
      SELECT m.id, m.title, m.position,
        json_agg(
          json_build_object(
            'id', l.id,
            'title', l.title,
            'type', l.type,
            'video_url', COALESCE(l.video_url, ''),
            'external_url', COALESCE(l.external_url, ''),
            'file_url', COALESCE(l.file_url, ''),
            'file_name', COALESCE(l.file_name, ''),
            'content', COALESCE(l.content, ''),
            'position', l.position,
            'is_preview', COALESCE(l.is_preview, false),
            'video_duration', COALESCE(l.video_duration, 0)
          ) ORDER BY l.position
        ) FILTER (WHERE l.id IS NOT NULL) as lessons
      FROM modules m
      LEFT JOIN lessons l ON l.module_id = m.id AND l.is_published = true
      WHERE m.course_id = ${params.id}
      GROUP BY m.id
      ORDER BY m.position
    `
    return NextResponse.json({ data })
  } catch (err: any) {
    // Fallback: if new columns don't exist yet, use basic columns only
    console.warn('[modules] Falling back to basic columns:', err.message)
    const data = await sql`
      SELECT m.id, m.title, m.position,
        json_agg(
          json_build_object(
            'id', l.id,
            'title', l.title,
            'type', l.type,
            'video_url', COALESCE(l.video_url, ''),
            'external_url', '',
            'file_url', COALESCE(l.file_url, ''),
            'file_name', '',
            'content', COALESCE(l.content, ''),
            'position', l.position,
            'is_preview', COALESCE(l.is_preview, false),
            'video_duration', COALESCE(l.video_duration, 0)
          ) ORDER BY l.position
        ) FILTER (WHERE l.id IS NOT NULL) as lessons
      FROM modules m
      LEFT JOIN lessons l ON l.module_id = m.id AND l.is_published = true
      WHERE m.course_id = ${params.id}
      GROUP BY m.id
      ORDER BY m.position
    `
    return NextResponse.json({ data })
  }
}
