import Link from 'next/link'

import { sql } from '@/lib/db'

import { Clock, Users, Star, BookOpen, ArrowRight } from 'lucide-react'

import { formatCurrency, getDifficultyColor } from '@/lib/utils'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'Courses' }

export default async function CoursesPage({ searchParams }: { searchParams: { category?: string; search?: string; difficulty?: string } }) {
  const categories = await sql`SELECT * FROM categories ORDER BY name`
  
  let query = `SELECT c.*, cat.name as category_name, cat.icon as category_icon, cat.slug as category_slug, u.full_name as instructor_name FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id WHERE c.status = 'published'`
  const params: any[] = []
  let i = 1
  if (searchParams.search) { query += ` AND c.title ILIKE $${i++}`; params.push(`%${searchParams.search}%`) }
  if (searchParams.difficulty) { query += ` AND c.difficulty = $${i++}`; params.push(searchParams.difficulty) }
  if (searchParams.category) { query += ` AND cat.slug = $${i++}`; params.push(searchParams.category) }
  query += ' ORDER BY c.is_featured DESC, c.total_students DESC'
  const courses = await sql(query as any, params as any)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100"><div className="max-w-7xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h1><p className="text-gray-500">Expert-led programs designed to get you job-ready</p></div></div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Category</label>
                <div className="space-y-1">
                  <Link href="/courses" className={`block text-sm px-3 py-2 rounded-lg transition-colors ${!searchParams.category ? 'bg-bloomy-50 text-bloomy-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>All Categories</Link>
                  {categories.map((cat: any) => (
                    <Link key={cat.id} href={`/courses?category=${cat.slug}`} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors ${searchParams.category === cat.slug ? 'bg-bloomy-50 text-bloomy-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <span>{cat.icon}</span><span className="truncate">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Level</label>
                <div className="space-y-1">
                  {[['', 'All Levels'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']].map(([val, label]) => (
                    <Link key={val} href={val ? `/courses?difficulty=${val}` : '/courses'} className={`block text-sm px-3 py-2 rounded-lg transition-colors ${(searchParams.difficulty || '') === val ? 'bg-bloomy-50 text-bloomy-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>{label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-6"><span className="font-semibold text-gray-900">{courses.length}</span> courses found</p>
            {courses.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {courses.map((course: any) => (
                  <Link key={course.id} href={`/courses/${course.slug}`} className="course-card bg-white rounded-2xl border border-gray-100 overflow-hidden group">
                    <div className="h-40 bg-gradient-to-br from-bloomy-600 to-blue-600 flex items-center justify-center">
                      {course.thumbnail_url ? <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" /> : <span className="text-4xl">{course.category_icon || '📚'}</span>}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">{course.category_name}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(course.difficulty)}`}>{course.difficulty}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm group-hover:text-bloomy-700 transition-colors">{course.title}</h3>
                      <p className="text-xs text-gray-400 mb-3">by {course.instructor_name}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration_weeks}w</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.total_lessons} lessons</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.total_students}</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="font-bold text-bloomy-700">{Number(course.price) === 0 ? 'Free' : formatCurrency(Number(course.price), course.currency)}</span>
                        <span className="text-bloomy-600 text-xs font-medium flex items-center gap-1">Enroll <ArrowRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20"><BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No courses found</p><Link href="/courses" className="btn-primary mt-4 inline-flex">Clear filters</Link></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
