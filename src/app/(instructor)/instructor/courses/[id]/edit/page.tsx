'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Trash2, Plus, GripVertical, Eye, Globe, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const CURRENCIES = ['NGN', 'USD', 'GBP']

export default function EditCoursePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'info' | 'curriculum' | 'settings'>('info')

  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('courses').select('*').eq('id', courseId).single(),
      supabase.from('modules').select(`*, lessons(*)`)
        .eq('course_id', courseId)
        .order('position'),
    ]).then(([cats, courseRes, modulesRes]) => {
      if (cats.data) setCategories(cats.data)
      if (courseRes.data) setCourse(courseRes.data)
      if (modulesRes.data) {
        setModules(modulesRes.data.map(m => ({
          ...m,
          lessons: (m.lessons || []).sort((a: any, b: any) => a.position - b.position)
        })))
      }
      setLoading(false)
    })
  }, [courseId])

  const updateCourse = (k: string, v: any) => setCourse((c: any) => ({ ...c, [k]: v }))

  async function saveCourse() {
    setSaving(true)
    const supabase = createClient()
    const tags = typeof course.tags === 'string'
      ? course.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : course.tags

    await supabase.from('courses').update({
      title: course.title,
      slug: course.slug,
      description: course.description,
      short_description: course.short_description,
      category_id: course.category_id,
      price: course.price,
      currency: course.currency,
      difficulty: course.difficulty,
      duration_weeks: course.duration_weeks,
      requirements: course.requirements,
      what_you_learn: course.what_you_learn,
      tags,
      certificate_enabled: course.certificate_enabled,
    }).eq('id', courseId)

    setSaving(false)
    router.refresh()
  }

  async function togglePublish() {
    setSaving(true)
    const supabase = createClient()
    const newStatus = course.status === 'published' ? 'draft' : 'published'
    await supabase.from('courses').update({ status: newStatus }).eq('id', courseId)
    setCourse((c: any) => ({ ...c, status: newStatus }))
    setSaving(false)
  }

  async function addModule() {
    const supabase = createClient()
    const position = modules.length
    const { data } = await supabase.from('modules').insert({
      course_id: courseId, title: `Module ${position + 1}`, position, is_published: true
    }).select().single()
    if (data) setModules(m => [...m, { ...data, lessons: [] }])
  }

  async function addLesson(moduleId: string, moduleIdx: number) {
    const supabase = createClient()
    const position = modules[moduleIdx].lessons.length
    const { data } = await supabase.from('lessons').insert({
      module_id: moduleId, course_id: courseId,
      title: `Lesson ${position + 1}`, type: 'video',
      position, is_published: true
    }).select().single()
    if (data) {
      setModules(m => m.map((mod, i) =>
        i === moduleIdx ? { ...mod, lessons: [...mod.lessons, data] } : mod
      ))
    }
  }

  async function updateLesson(lessonId: string, moduleIdx: number, lessonIdx: number, key: string, value: string) {
    const supabase = createClient()
    await supabase.from('lessons').update({ [key]: value }).eq('id', lessonId)
    setModules(m => m.map((mod, i) =>
      i === moduleIdx ? {
        ...mod,
        lessons: mod.lessons.map((l: any, j: number) =>
          j === lessonIdx ? { ...l, [key]: value } : l
        )
      } : mod
    ))
  }

  async function deleteLesson(lessonId: string, moduleIdx: number, lessonIdx: number) {
    const supabase = createClient()
    await supabase.from('lessons').delete().eq('id', lessonId)
    setModules(m => m.map((mod, i) =>
      i === moduleIdx ? { ...mod, lessons: mod.lessons.filter((_: any, j: number) => j !== lessonIdx) } : mod
    ))
  }

  async function updateModuleTitle(moduleId: string, idx: number, title: string) {
    const supabase = createClient()
    await supabase.from('modules').update({ title }).eq('id', moduleId)
    setModules(m => m.map((mod, i) => i === idx ? { ...mod, title } : mod))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 text-bloomy-600 animate-spin" />
    </div>
  )

  if (!course) return <p className="text-center text-gray-500 mt-20">Course not found.</p>

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 focus:border-transparent'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/instructor/courses" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-md">{course.title}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Last edited just now</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/courses/${course.slug}`}
            target="_blank"
            className="btn-secondary text-sm flex items-center gap-1.5 py-2"
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>
          <button
            onClick={togglePublish}
            disabled={saving}
            className={`text-sm flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-colors ${
              course.status === 'published'
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            }`}
          >
            {course.status === 'published' ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Globe className="w-3.5 h-3.5" /> Publish</>}
          </button>
          <button onClick={saveCourse} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5 py-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['info', 'curriculum', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-bloomy-600 text-bloomy-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title</label>
              <input
                value={course.title || ''}
                onChange={e => updateCourse('title', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label>
              <input
                value={course.slug || ''}
                onChange={e => updateCourse('slug', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
            <textarea
              value={course.short_description || ''}
              onChange={e => updateCourse('short_description', e.target.value)}
              rows={2}
              className={inputCls + ' resize-none'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label>
            <textarea
              value={course.description || ''}
              onChange={e => updateCourse('description', e.target.value)}
              rows={5}
              className={inputCls + ' resize-none'}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={course.category_id || ''} onChange={e => updateCourse('category_id', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
              <select value={course.difficulty || 'beginner'} onChange={e => updateCourse('difficulty', e.target.value)} className={inputCls}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (weeks)</label>
              <input type="number" value={course.duration_weeks || 12} onChange={e => updateCourse('duration_weeks', parseInt(e.target.value))} className={inputCls} min={1} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price</label>
              <input type="number" value={course.price || 0} onChange={e => updateCourse('price', parseFloat(e.target.value))} className={inputCls} min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <select value={course.currency || 'NGN'} onChange={e => updateCourse('currency', e.target.value)} className={inputCls}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma separated)</label>
            <input
              value={Array.isArray(course.tags) ? course.tags.join(', ') : course.tags || ''}
              onChange={e => updateCourse('tags', e.target.value)}
              className={inputCls}
              placeholder="AWS, Docker, Kubernetes"
            />
          </div>
        </div>
      )}

      {/* Curriculum Tab */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          {modules.map((mod, mi) => (
            <div key={mod.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                <input
                  value={mod.title}
                  onChange={e => updateModuleTitle(mod.id, mi, e.target.value)}
                  className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-bloomy-300 rounded px-1"
                />
                <span className="text-xs text-gray-400">{mod.lessons.length} lessons</span>
              </div>

              <div className="p-4 space-y-2">
                {mod.lessons.map((lesson: any, li: number) => (
                  <div key={lesson.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 group">
                    <select
                      value={lesson.type}
                      onChange={e => updateLesson(lesson.id, mi, li, 'type', e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white"
                    >
                      <option value="video">📹 Video</option>
                      <option value="text">📄 Text</option>
                      <option value="quiz">❓ Quiz</option>
                      <option value="assignment">📎 Assignment</option>
                    </select>
                    <input
                      value={lesson.title}
                      onChange={e => updateLesson(lesson.id, mi, li, 'title', e.target.value)}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400 bg-white"
                      placeholder="Lesson title"
                    />
                    <input
                      value={lesson.video_url || ''}
                      onChange={e => updateLesson(lesson.id, mi, li, 'video_url', e.target.value)}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400 bg-white"
                      placeholder="Video URL"
                    />
                    <input
                      type="number"
                      value={lesson.video_duration || ''}
                      onChange={e => updateLesson(lesson.id, mi, li, 'video_duration', e.target.value)}
                      className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400 bg-white"
                      placeholder="Secs"
                    />
                    <button
                      onClick={() => deleteLesson(lesson.id, mi, li)}
                      className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addLesson(mod.id, mi)}
                  className="w-full py-2.5 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Lesson
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addModule}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:text-bloomy-600 hover:border-bloomy-200 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Module
          </button>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Course Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium text-sm text-gray-900">Certificate Enabled</p>
                  <p className="text-xs text-gray-500 mt-0.5">Issue certificates on course completion</p>
                </div>
                <input
                  type="checkbox"
                  checked={course.certificate_enabled}
                  onChange={e => updateCourse('certificate_enabled', e.target.checked)}
                  className="w-4 h-4 accent-bloomy-600"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium text-sm text-gray-900">Cohort-Based</p>
                  <p className="text-xs text-gray-500 mt-0.5">Group students into cohort batches</p>
                </div>
                <input
                  type="checkbox"
                  checked={course.cohort_based}
                  onChange={e => updateCourse('cohort_based', e.target.checked)}
                  className="w-4 h-4 accent-bloomy-600"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-medium text-sm text-gray-900">Featured Course</p>
                  <p className="text-xs text-gray-500 mt-0.5">Show this course prominently on the homepage</p>
                </div>
                <input
                  type="checkbox"
                  checked={course.is_featured}
                  onChange={e => updateCourse('is_featured', e.target.checked)}
                  className="w-4 h-4 accent-bloomy-600"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button onClick={saveCourse} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
