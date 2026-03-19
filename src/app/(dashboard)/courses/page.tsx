import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Search, Filter, Clock, Users, Star, BookOpen, ArrowRight } from 'lucide-react'
import { formatCurrency, getDifficultyColor } from '@/lib/utils'

export const metadata = { title: 'Courses' }

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; difficulty?: string }
}) {
  const supabase = await createClient()

  const { data: categories } = await supabase.from('categories').select('*')

  let query = supabase
    .from('courses')
    .select(`*, category:categories(*), instructor:profiles(id, full_name, avatar_url)`)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('total_students', { ascending: false })

  if (searchParams.search) query = query.ilike('title', `%${searchParams.search}%`)
  if (searchParams.category) query = query.eq('category_id',
    categories?.find(c => c.slug === searchParams.category)?.id || ''
  )
  if (searchParams.difficulty) query = query.eq('difficulty', searchParams.difficulty)

  const { data: courses } = await query

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Courses</h1>
          <p className="text-gray-500">Expert-led programs designed to get you job-ready</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filters
              </h3>

              {/* Search */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Search</label>
                <form method="GET">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="search"
                      defaultValue={searchParams.search}
                      placeholder="Search courses..."
                      className="input-field pl-9 text-sm"
                    />
                  </div>
                </form>
              </div>

              {/* Categories */}
              <div className="mb-5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Category</label>
                <div className="space-y-1">
                  <Link
                    href="/courses"
                    className={`block text-sm px-3 py-2 rounded-lg transition-colors ${!searchParams.category ? 'bg-bloomy-50 text-bloomy-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    All Categories
                  </Link>
                  {categories?.map(cat => (
                    <Link
                      key={cat.id}
                      href={`/courses?category=${cat.slug}`}
                      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors ${searchParams.category === cat.slug ? 'bg-bloomy-50 text-bloomy-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">Level</label>
                <div className="space-y-1">
                  {[['', 'All Levels'], ['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']].map(([val, label]) => (
                    <Link
                      key={val}
                      href={val ? `/courses?difficulty=${val}` : '/courses'}
                      className={`block text-sm px-3 py-2 rounded-lg transition-colors ${searchParams.difficulty === val || (!searchParams.difficulty && !val) ? 'bg-bloomy-50 text-bloomy-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Courses grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{courses?.length || 0}</span> courses found
              </p>
            </div>

            {courses && courses.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {courses.map(course => (
                  <Link key={course.id} href={`/courses/${course.slug}`} className="course-card bg-white rounded-2xl border border-gray-100 overflow-hidden group">
                    {/* Thumbnail */}
                    <div className="h-40 bg-gradient-to-br from-bloomy-600 to-blue-600 relative overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">{course.category?.icon || '📚'}</span>
                        </div>
                      )}
                      {course.is_featured && (
                        <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">⭐ Featured</span>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">{course.category?.name}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(course.difficulty)}`}>
                          {course.difficulty}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm leading-snug group-hover:text-bloomy-700 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">by {course.instructor?.full_name}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration_weeks}w</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.total_lessons} lessons</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.total_students}</span>
                      </div>

                      {course.average_rating > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-gray-700">{course.average_rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({course.total_reviews})</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <span className="font-bold text-bloomy-700">
                          {course.price === 0 ? 'Free' : formatCurrency(course.price, course.currency)}
                        </span>
                        <span className="text-bloomy-600 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                          Enroll now <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No courses found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                <Link href="/courses" className="btn-primary mt-4 inline-flex">Clear filters</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
