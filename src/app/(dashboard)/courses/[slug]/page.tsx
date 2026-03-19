import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Clock, Users, Star, BookOpen, Award, CheckCircle, Play, Lock } from 'lucide-react'
import { formatCurrency, getDifficultyColor } from '@/lib/utils'
import EnrollButton from '@/components/student/EnrollButton'

export const dynamic = 'force-dynamic'

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const courses = await sql`SELECT c.*, cat.name as category_name, cat.icon as category_icon, u.full_name as instructor_name, u.avatar_url as instructor_avatar, u.bio as instructor_bio FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id WHERE c.slug = ${params.slug} AND c.status = 'published' LIMIT 1`
  const course = courses[0]
  if (!course) notFound()

  const modules = await sql`SELECT m.id, m.title, m.position, json_agg(json_build_object('id',l.id,'title',l.title,'type',l.type,'video_duration',l.video_duration,'is_preview',l.is_preview) ORDER BY l.position) FILTER (WHERE l.id IS NOT NULL) as lessons FROM modules m LEFT JOIN lessons l ON l.module_id = m.id AND l.is_published = true WHERE m.course_id = ${course.id} AND m.is_published = true GROUP BY m.id ORDER BY m.position`

  let enrollment = null
  if (session?.user) {
    const userId = (session.user as any).id
    const e = await sql`SELECT * FROM enrollments WHERE student_id = ${userId} AND course_id = ${course.id} LIMIT 1`
    enrollment = e[0] || null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-gray-900 to-bloomy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4"><span className="text-sm text-bloomy-300">{course.category_name}</span><span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-white`}>{course.difficulty}</span></div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-300 mb-6 text-lg">{course.short_description || course.description}</p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 mb-6">
                {Number(course.average_rating) > 0 && <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="font-medium text-white">{Number(course.average_rating).toFixed(1)}</span><span>({course.total_reviews})</span></div>}
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.total_students}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration_weeks} weeks</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {course.total_lessons} lessons</span>
              </div>
              <div className="flex items-center gap-3"><div className="w-10 h-10 bg-bloomy-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{course.instructor_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div><div><p className="text-xs text-gray-400">Instructor</p><p className="font-medium">{course.instructor_name}</p></div></div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden sticky top-24">
                <div className="h-44 bg-gradient-to-br from-bloomy-600 to-blue-600 flex items-center justify-center"><span className="text-6xl">{course.category_icon || '📚'}</span></div>
                <div className="p-6">
                  <p className="text-3xl font-bold text-gray-900 mb-5">{Number(course.price) === 0 ? 'Free' : formatCurrency(Number(course.price), course.currency)}</p>
                  <EnrollButton course={course} enrollment={enrollment} userId={(session?.user as any)?.id} />
                  <div className="mt-5 space-y-3">
                    {[[`${course.duration_weeks} weeks`, Clock],[`${course.total_lessons} lessons`, BookOpen],['Certificate', Award],['Lifetime access', CheckCircle]].map(([text, Icon]: any) => (
                      <div key={text} className="flex items-center gap-2 text-sm text-gray-600"><Icon className="w-4 h-4 text-green-500" />{text}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {course.what_you_learn?.length > 0 && <div className="bg-white rounded-2xl border border-gray-100 p-6"><h2 className="text-xl font-bold text-gray-900 mb-4">What you'll learn</h2><div className="grid sm:grid-cols-2 gap-3">{course.what_you_learn.map((item: string) => <div key={item} className="flex items-start gap-2 text-sm text-gray-700"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />{item}</div>)}</div></div>}
            {modules.length > 0 && <div className="bg-white rounded-2xl border border-gray-100 p-6"><h2 className="text-xl font-bold text-gray-900 mb-5">Course Curriculum</h2><div className="space-y-3">{modules.map((mod: any) => <details key={mod.id} className="group border border-gray-100 rounded-xl overflow-hidden" open={mod.position === 0}><summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 select-none"><div><h3 className="font-semibold text-gray-900 text-sm">{mod.title}</h3><p className="text-xs text-gray-400 mt-0.5">{mod.lessons?.length || 0} lessons</p></div></summary><div className="border-t border-gray-100">{mod.lessons?.map((l: any) => <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"><div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">{l.is_preview || enrollment ? <Play className="w-3 h-3 text-bloomy-600" /> : <Lock className="w-3 h-3 text-gray-400" />}</div><span className="text-sm text-gray-700 flex-1">{l.title}</span>{l.video_duration && <span className="text-xs text-gray-400">{Math.floor(l.video_duration/60)}m</span>}</div>)}</div></details>)}</div></div>}
          </div>
          <div className="lg:col-span-1">{course.tags?.length > 0 && <div className="bg-white rounded-2xl border border-gray-100 p-5"><h3 className="font-semibold text-gray-900 mb-3 text-sm">Skills you'll gain</h3><div className="flex flex-wrap gap-2">{course.tags.map((tag: string) => <span key={tag} className="text-xs bg-bloomy-50 text-bloomy-700 font-medium px-3 py-1.5 rounded-lg">{tag}</span>)}</div></div>}</div>
        </div>
      </div>
    </div>
  )
}
