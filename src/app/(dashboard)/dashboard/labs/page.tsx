import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { FlaskConical, FileText, ExternalLink, BookOpen, ArrowLeft, Download, Link2, HelpCircle, Paperclip } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Labs & Resources' }

export default async function LabsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  // Get enrolled courses
  const courses = await sql`
    SELECT c.id as course_id, c.title as course_title, c.slug, c.total_lessons,
      cat.icon as category_icon
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE e.student_id = ${userId}
    ORDER BY e.enrolled_at DESC
  `

  if (courses.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FlaskConical className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No labs yet</h1>
        <p className="text-gray-500 text-sm">You haven't been enrolled in any courses. Labs and materials will appear here once enrolled.</p>
      </div>
    )
  }

  const courseIds = courses.map((c: any) => c.course_id)

  // Get file/url lessons from enrolled courses
  const fileLessons = await sql`
    SELECT
      l.id as lesson_id, l.title, l.type, l.file_url, l.file_name,
      l.external_url, l.video_url, l.content,
      m.title as module_title,
      c.title as course_title, c.slug as course_slug, c.id as course_id,
      cat.icon as category_icon,
      EXISTS(
        SELECT 1 FROM lesson_progress lp
        WHERE lp.lesson_id = l.id AND lp.student_id = ${userId} AND lp.completed = true
      ) as completed
    FROM lessons l
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE c.id = ANY(${courseIds})
      AND l.is_published = true
      AND l.type IN ('file', 'url', 'quiz', 'assignment')
    ORDER BY c.title, m.position, l.position
  `

  // Try to get resources (table may not exist yet)
  let resources: any[] = []
  try {
    resources = await sql`
      SELECT
        r.id, r.name, r.url, r.type,
        l.title as lesson_title,
        m.title as module_title,
        c.title as course_title, c.slug as course_slug, c.id as course_id,
        cat.icon as category_icon
      FROM resources r
      JOIN lessons l ON r.lesson_id = l.id
      JOIN modules m ON l.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = ANY(${courseIds})
      ORDER BY c.title, m.position
    `
  } catch (_) {
    // resources table not yet created — skip silently
    resources = []
  }

  const fileItems = fileLessons.filter((l: any) => l.type === 'file' || l.type === 'url')
  const labItems = fileLessons.filter((l: any) => l.type === 'quiz' || l.type === 'assignment')

  const typeIcon = (type: string) => {
    if (type === 'pdf') return '📄'
    if (type === 'video') return '🎬'
    if (type === 'pptx' || type === 'presentation') return '📊'
    if (type === 'zip') return '📦'
    if (type === 'word' || type === 'doc') return '📝'
    return '📎'
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Labs & Resources</h1>
          <p className="text-gray-500 text-sm mt-0.5">Materials, labs and assignments from your courses</p>
        </div>
      </div>

      {/* Course materials — file/url lessons */}
      {fileItems.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-bloomy-500" /> Course Materials
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {fileItems.map((item: any) => {
              const url = item.file_url || item.external_url || item.video_url
              return (
                <div key={item.lesson_id} className="flex items-center gap-3.5 px-4 py-3.5">
                  <div className="w-9 h-9 bg-bloomy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {item.type === 'url' ? <Link2 className="w-4 h-4 text-bloomy-600" /> : <FileText className="w-4 h-4 text-bloomy-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{item.file_name || item.title}</p>
                    <p className="text-xs text-gray-400 truncate">{item.course_title} · {item.module_title}</p>
                  </div>
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-bloomy-600 bg-bloomy-50 hover:bg-bloomy-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                      {item.type === 'file' ? <><Download className="w-3.5 h-3.5" />Open</> : <><ExternalLink className="w-3.5 h-3.5" />Visit</>}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Resources attached to lessons */}
      {resources.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-bloomy-500" /> Attached Resources
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {resources.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3.5 px-4 py-3.5">
                <span className="text-xl flex-shrink-0">{typeIcon(r.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 truncate">{r.course_title} · {r.module_title}</p>
                </div>
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-bloomy-50 text-bloomy-600 hover:bg-bloomy-100 flex-shrink-0">
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Labs — quizzes and assignments */}
      {labItems.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-bloomy-500" /> Labs & Assignments
          </h2>
          <div className="space-y-3">
            {/* Group by course */}
            {Array.from(new Set(labItems.map((l: any) => l.course_id))).map(courseId => {
              const items = labItems.filter((l: any) => l.course_id === courseId)
              const first = items[0]
              return (
                <div key={String(courseId)} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <span className="text-lg">{first.category_icon || '📚'}</span>
                    <p className="font-semibold text-sm text-gray-900">{first.course_title}</p>
                    <span className="ml-auto text-xs text-gray-400">{items.length} task{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  {items.map((lab: any) => (
                    <Link key={lab.lesson_id} href={`/learn/${lab.course_slug}?lesson=${lab.lesson_id}`}
                      className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        lab.completed ? 'bg-green-100' : lab.type === 'quiz' ? 'bg-purple-50' : 'bg-orange-50'
                      }`}>
                        {lab.completed
                          ? <span className="text-base">✅</span>
                          : lab.type === 'quiz'
                          ? <HelpCircle className="w-4 h-4 text-purple-600" />
                          : <Paperclip className="w-4 h-4 text-orange-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate group-hover:text-bloomy-700">{lab.title}</p>
                        <p className="text-xs text-gray-400">{lab.module_title} · {lab.type}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                        lab.completed
                          ? 'bg-green-50 text-green-700'
                          : lab.type === 'quiz' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'
                      }`}>
                        {lab.completed ? '✓ Done' : lab.type === 'quiz' ? 'Take Quiz' : 'Submit'}
                      </span>
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {fileItems.length === 0 && resources.length === 0 && labItems.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FlaskConical className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-600 mb-1">No materials uploaded yet</p>
          <p className="text-sm text-gray-400">Your instructor will upload course materials, labs and assignments here.</p>
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-bloomy-500" /> Jump to Course
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {courses.map((c: any) => (
            <Link key={c.course_id} href={`/learn/${c.slug}`}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5 hover:shadow-sm hover:border-bloomy-100 transition-all group">
              <div className="w-10 h-10 bloomy-gradient rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {c.category_icon || '📚'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-bloomy-700">{c.course_title}</p>
                <p className="text-xs text-gray-400">{c.total_lessons} lessons</p>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-bloomy-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
