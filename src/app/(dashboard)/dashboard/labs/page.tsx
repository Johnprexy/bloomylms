import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { FlaskConical, FileText, Download, ExternalLink, BookOpen, Lock } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Labs & Resources' }

export default async function LabsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  // Get all enrolled courses with their resources
  const courses = await sql`
    SELECT
      c.id as course_id, c.title as course_title, c.slug, c.total_lessons,
      cat.icon as category_icon,
      json_agg(
        json_build_object(
          'module_id', m.id,
          'module_title', m.title,
          'module_position', m.position
        ) ORDER BY m.position
      ) FILTER (WHERE m.id IS NOT NULL) as modules
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    LEFT JOIN modules m ON m.course_id = c.id AND m.is_published = true
    WHERE e.student_id = ${userId}
    GROUP BY c.id, c.title, c.slug, c.total_lessons, cat.icon
    ORDER BY e.enrolled_at DESC
  `

  // Get resources for enrolled courses
  const resources = await sql`
    SELECT
      r.id, r.name, r.url, r.type, r.created_at,
      l.title as lesson_title,
      m.title as module_title,
      c.title as course_title, c.slug as course_slug, c.id as course_id,
      cat.icon as category_icon
    FROM resources r
    JOIN lessons l ON r.lesson_id = l.id
    JOIN modules m ON l.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    JOIN enrollments e ON e.course_id = c.id AND e.student_id = ${userId}
    ORDER BY c.title, m.position, l.position
  `

  // Get lab lessons (type = quiz or assignment)
  const labs = await sql`
    SELECT
      l.id as lesson_id, l.title as lesson_title, l.type, l.content,
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
    JOIN enrollments e ON e.course_id = c.id AND e.student_id = ${userId}
    WHERE l.type IN ('quiz', 'assignment') AND l.is_published = true
    ORDER BY c.title, m.position, l.position
  `

  const typeIcon = (type: string) => {
    if (type === 'pdf') return '📄'
    if (type === 'video') return '🎬'
    if (type === 'link') return '🔗'
    if (type === 'zip') return '📦'
    return '📎'
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <FlaskConical className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-3">No labs yet</h1>
        <p className="text-gray-500 text-sm">You haven't been assigned to any courses yet. Labs and resources will appear here once you are enrolled.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Labs & Resources</h1>
        <p className="text-gray-500 text-sm mt-0.5">Course materials, assignments and lab exercises for your enrolled courses</p>
      </div>

      {/* Resources section */}
      {resources.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-bloomy-500" />
            Course Materials
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {resources.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <span className="text-xl flex-shrink-0">{typeIcon(r.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 truncate">{r.course_title} · {r.module_title}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase font-medium">{r.type}</span>
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-bloomy-50 text-bloomy-600 hover:bg-bloomy-100 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Labs / Assignments section */}
      {labs.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-bloomy-500" />
            Labs & Assignments
          </h2>
          <div className="space-y-3">
            {/* Group by course */}
            {Array.from(new Set(labs.map((l: any) => l.course_id))).map(courseId => {
              const courseLabs = labs.filter((l: any) => l.course_id === courseId)
              const first = courseLabs[0]
              return (
                <div key={courseId as string} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <span className="text-lg">{first.category_icon || '📚'}</span>
                    <p className="font-semibold text-sm text-gray-900">{first.course_title}</p>
                    <span className="ml-auto text-xs text-gray-400">{courseLabs.length} lab{courseLabs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {courseLabs.map((lab: any) => (
                      <Link key={lab.lesson_id} href={`/learn/${lab.course_slug}?lesson=${lab.lesson_id}`}
                        className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 transition-colors group">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          lab.completed ? 'bg-green-100' : lab.type === 'quiz' ? 'bg-blue-50' : 'bg-orange-50'
                        }`}>
                          <span className="text-base">{lab.completed ? '✅' : lab.type === 'quiz' ? '❓' : '📝'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate group-hover:text-bloomy-700">{lab.lesson_title}</p>
                          <p className="text-xs text-gray-400">{lab.module_title} · {lab.type}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {lab.completed
                            ? <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">Done</span>
                            : <span className="text-xs font-medium text-bloomy-600 bg-bloomy-50 px-2 py-1 rounded-full group-hover:bg-bloomy-100">
                                {lab.type === 'quiz' ? 'Take Quiz' : 'Submit'}
                              </span>
                          }
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-bloomy-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {resources.length === 0 && labs.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <FlaskConical className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-600 mb-1">No materials uploaded yet</p>
          <p className="text-sm text-gray-400">Your instructor will upload course materials, labs and assignments here.</p>
        </div>
      )}

      {/* Quick links to courses */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-bloomy-500" />
          Jump to Course
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
