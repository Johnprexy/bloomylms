import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Clock, Users, Star, BookOpen, Award, CheckCircle, Play, Lock, ChevronDown } from 'lucide-react'
import { formatCurrency, getDifficultyColor } from '@/lib/utils'
import EnrollButton from '@/components/student/EnrollButton'

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      category:categories(*),
      instructor:profiles(id, full_name, avatar_url, bio, linkedin_url),
      modules(
        id, title, description, position, is_published,
        lessons(id, title, type, video_duration, position, is_published, is_preview)
      )
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (error || !course) notFound()

  // Check enrollment
  let enrollment = null
  if (user) {
    const { data } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .single()
    enrollment = data
  }

  const sortedModules = course.modules
    ?.sort((a: any, b: any) => a.position - b.position)
    .map((m: any) => ({ ...m, lessons: m.lessons?.sort((a: any, b: any) => a.position - b.position) }))

  const totalDuration = course.modules?.flatMap((m: any) => m.lessons || [])
    .reduce((sum: number, l: any) => sum + (l.video_duration || 0), 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-bloomy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-bloomy-300">{course.category?.name}</span>
                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-white`}>
                  {course.difficulty}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">{course.title}</h1>
              <p className="text-gray-300 mb-6 text-lg leading-relaxed">{course.short_description || course.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 mb-6">
                {course.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-white">{course.average_rating.toFixed(1)}</span>
                    <span>({course.total_reviews} reviews)</span>
                  </div>
                )}
                <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {course.total_students} students</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {course.duration_weeks} weeks</span>
                <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {course.total_lessons} lessons</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bloomy-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {course.instructor?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Instructor</p>
                  <p className="font-medium text-white">{course.instructor?.full_name}</p>
                </div>
              </div>
            </div>

            {/* Enrollment card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden sticky top-24">
                <div className="h-44 bg-gradient-to-br from-bloomy-600 to-blue-600 flex items-center justify-center">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-6xl">{course.category?.icon || '📚'}</span>
                  )}
                </div>
                <div className="p-6">
                  <div className="mb-5">
                    <p className="text-3xl font-bold text-gray-900">
                      {course.price === 0 ? 'Free' : formatCurrency(course.price, course.currency)}
                    </p>
                  </div>

                  <EnrollButton course={course} enrollment={enrollment} userId={user?.id} />

                  <div className="mt-5 space-y-3">
                    {[
                      [`${course.duration_weeks} weeks of content`, Clock],
                      [`${course.total_lessons} lessons`, BookOpen],
                      ['Certificate of completion', Award],
                      ['Lifetime access', CheckCircle],
                    ].map(([text, Icon]: any) => (
                      <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {text}
                      </div>
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
            {/* What you'll learn */}
            {course.what_you_learn && course.what_you_learn.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">What you'll learn</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {course.what_you_learn.map((item: string) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            {sortedModules && sortedModules.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Course Curriculum</h2>
                <p className="text-sm text-gray-500 mb-5">
                  {course.total_lessons} lessons • {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}m total length
                </p>
                <div className="space-y-3">
                  {sortedModules.map((module: any) => (
                    <details key={module.id} className="group border border-gray-100 rounded-xl overflow-hidden" open={module.position === 0}>
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 select-none">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{module.title}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{module.lessons?.length || 0} lessons</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="border-t border-gray-100">
                        {module.lessons?.map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              {lesson.is_preview || enrollment ? (
                                <Play className="w-3 h-3 text-bloomy-600" />
                              ) : (
                                <Lock className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                            <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                            <div className="flex items-center gap-2">
                              {lesson.is_preview && !enrollment && (
                                <span className="text-xs text-bloomy-600 font-medium">Preview</span>
                              )}
                              {lesson.video_duration && (
                                <span className="text-xs text-gray-400">
                                  {Math.floor(lesson.video_duration / 60)}m
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
                <ul className="space-y-2">
                  {course.requirements.map((req: string) => (
                    <li key={req} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-bloomy-400 rounded-full mt-2 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructor */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Instructor</h2>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bloomy-gradient rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {course.instructor?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{course.instructor?.full_name}</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{course.instructor?.bio || 'Experienced industry professional and educator at Bloomy Technologies.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - tags */}
          <div className="lg:col-span-1">
            {course.tags && course.tags.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Skills you'll gain</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-bloomy-50 text-bloomy-700 font-medium px-3 py-1.5 rounded-lg">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
