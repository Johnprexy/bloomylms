'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, BookOpen, Video, FileText, HelpCircle, Save } from 'lucide-react'
import { slugify } from '@/lib/utils'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const CURRENCIES = ['NGN', 'USD', 'GBP']

export default function NewCoursePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [courseId, setCourseId] = useState<string | null>(null)

  const [course, setCourse] = useState({
    title: '', slug: '', short_description: '', description: '',
    category_id: '', price: 0, currency: 'NGN',
    difficulty: 'beginner', duration_weeks: 12,
    requirements: [''], what_you_learn: [''], tags: '',
    certificate_enabled: true,
  })

  const [modules, setModules] = useState([
    { title: 'Module 1: Introduction', lessons: [{ title: '', type: 'video', content: '' }] }
  ])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('categories').select('*').then(({ data }) => data && setCategories(data))
  }, [])

  const updateCourse = (k: string, v: any) => setCourse(f => ({
    ...f, [k]: v,
    ...(k === 'title' ? { slug: slugify(v) } : {})
  }))

  const updateList = (field: 'requirements' | 'what_you_learn', idx: number, val: string) => {
    const arr = [...course[field]]
    arr[idx] = val
    updateCourse(field, arr)
  }

  const addListItem = (field: 'requirements' | 'what_you_learn') =>
    updateCourse(field, [...course[field], ''])

  const removeListItem = (field: 'requirements' | 'what_you_learn', idx: number) =>
    updateCourse(field, course[field].filter((_: string, i: number) => i !== idx))

  const addModule = () =>
    setModules(m => [...m, { title: `Module ${m.length + 1}`, lessons: [{ title: '', type: 'video', content: '' }] }])

  const addLesson = (mi: number) =>
    setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: [...mod.lessons, { title: '', type: 'video', content: '' }] } : mod))

  const updateModule = (mi: number, k: string, v: string) =>
    setModules(m => m.map((mod, i) => i === mi ? { ...mod, [k]: v } : mod))

  const updateLesson = (mi: number, li: number, k: string, v: string) =>
    setModules(m => m.map((mod, i) => i === mi ? {
      ...mod, lessons: mod.lessons.map((l, j) => j === li ? { ...l, [k]: v } : l)
    } : mod))

  const removeLesson = (mi: number, li: number) =>
    setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== li) } : mod))

  async function saveCourse() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tags = course.tags.split(',').map(t => t.trim()).filter(Boolean)

    const { data: saved, error } = await supabase
      .from('courses')
      .upsert({
        ...course, tags,
        requirements: course.requirements.filter(Boolean),
        what_you_learn: course.what_you_learn.filter(Boolean),
        instructor_id: user.id,
        status: 'draft',
        ...(courseId ? { id: courseId } : {})
      })
      .select()
      .single()

    if (error || !saved) { setSaving(false); return }
    setCourseId(saved.id)

    // Save modules and lessons
    for (let mi = 0; mi < modules.length; mi++) {
      const mod = modules[mi]
      const { data: savedMod } = await supabase
        .from('modules')
        .insert({ course_id: saved.id, title: mod.title, position: mi, is_published: true })
        .select().single()

      if (savedMod) {
        for (let li = 0; li < mod.lessons.length; li++) {
          const lesson = mod.lessons[li]
          if (lesson.title) {
            await supabase.from('lessons').insert({
              module_id: savedMod.id, course_id: saved.id,
              title: lesson.title, type: lesson.type,
              content: lesson.content, position: li, is_published: true,
            })
          }
        }
      }
    }

    setSaving(false)
    router.push('/instructor/courses')
  }

  async function publishCourse() {
    if (!courseId) { await saveCourse(); return }
    const supabase = createClient()
    await supabase.from('courses').update({ status: 'published' }).eq('id', courseId)
    router.push('/instructor/courses')
  }

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 focus:border-transparent'

  return (
    <div className="max-w-4xl mx-auto">
      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        {['Course Info', 'Curriculum', 'Review'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button
              onClick={() => setStep(i + 1)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === i + 1 ? 'bloomy-gradient text-white' : step > i + 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              {step > i + 1 ? '✓' : i + 1}
            </button>
            <span className={`text-sm font-medium ${step === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <div className={`w-12 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Course Info */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Course Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title *</label>
            <input value={course.title} onChange={e => updateCourse('title', e.target.value)} className={inputCls} placeholder="e.g. Linux, DevOps & Cloud Engineering" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label>
            <input value={course.slug} onChange={e => updateCourse('slug', e.target.value)} className={inputCls} placeholder="linux-devops-cloud" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
            <textarea value={course.short_description} onChange={e => updateCourse('short_description', e.target.value)} rows={2} className={inputCls + ' resize-none'} placeholder="1-2 sentence summary" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description *</label>
            <textarea value={course.description} onChange={e => updateCourse('description', e.target.value)} rows={5} className={inputCls + ' resize-none'} placeholder="Detailed course description..." />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={course.category_id} onChange={e => updateCourse('category_id', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
              <select value={course.difficulty} onChange={e => updateCourse('difficulty', e.target.value)} className={inputCls}>
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (weeks)</label>
              <input type="number" value={course.duration_weeks} onChange={e => updateCourse('duration_weeks', parseInt(e.target.value))} className={inputCls} min={1} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price</label>
              <input type="number" value={course.price} onChange={e => updateCourse('price', parseFloat(e.target.value))} className={inputCls} min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
              <select value={course.currency} onChange={e => updateCourse('currency', e.target.value)} className={inputCls}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma separated)</label>
            <input value={course.tags} onChange={e => updateCourse('tags', e.target.value)} className={inputCls} placeholder="AWS, Docker, Kubernetes, Linux" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">What students will learn</label>
            {course.what_you_learn.map((item: string, i: number) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={item} onChange={e => updateList('what_you_learn', i, e.target.value)} className={inputCls} placeholder={`Learning outcome ${i + 1}`} />
                {course.what_you_learn.length > 1 && (
                  <button onClick={() => removeListItem('what_you_learn', i)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addListItem('what_you_learn')} className="text-sm text-bloomy-600 hover:text-bloomy-700 flex items-center gap-1 mt-1">
              <Plus className="w-3.5 h-3.5" /> Add outcome
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
            {course.requirements.map((req: string, i: number) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={req} onChange={e => updateList('requirements', i, e.target.value)} className={inputCls} placeholder={`Requirement ${i + 1}`} />
                {course.requirements.length > 1 && (
                  <button onClick={() => removeListItem('requirements', i)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addListItem('requirements')} className="text-sm text-bloomy-600 hover:text-bloomy-700 flex items-center gap-1 mt-1">
              <Plus className="w-3.5 h-3.5" /> Add requirement
            </button>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setStep(2)} disabled={!course.title} className="btn-primary">
              Next: Add Curriculum →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Curriculum */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Course Curriculum</h2>
            <button onClick={addModule} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Module
            </button>
          </div>

          {modules.map((mod, mi) => (
            <div key={mi} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <input
                  value={mod.title}
                  onChange={e => updateModule(mi, 'title', e.target.value)}
                  className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none"
                  placeholder={`Module ${mi + 1} title`}
                />
                <span className="text-xs text-gray-400">{mod.lessons.length} lessons</span>
              </div>

              <div className="p-4 space-y-3">
                {mod.lessons.map((lesson, li) => (
                  <div key={li} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                    <select
                      value={lesson.type}
                      onChange={e => updateLesson(mi, li, 'type', e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white mt-0.5"
                    >
                      <option value="video">📹 Video</option>
                      <option value="text">📄 Text</option>
                      <option value="quiz">❓ Quiz</option>
                      <option value="assignment">📎 Assignment</option>
                    </select>
                    <input
                      value={lesson.title}
                      onChange={e => updateLesson(mi, li, 'title', e.target.value)}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400"
                      placeholder={`Lesson ${li + 1} title`}
                    />
                    {lesson.type === 'video' && (
                      <input
                        value={lesson.content}
                        onChange={e => updateLesson(mi, li, 'content', e.target.value)}
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400"
                        placeholder="Video URL (Bunny/YouTube)"
                      />
                    )}
                    <button onClick={() => removeLesson(mi, li)} className="text-gray-300 hover:text-red-400 transition-colors mt-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addLesson(mi)}
                  className="w-full py-2 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Lesson
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
            <button onClick={() => setStep(3)} className="btn-primary">Next: Review →</button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Review & Publish</h2>

          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Title</span>
              <span className="font-medium text-gray-900">{course.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Price</span>
              <span className="font-medium text-gray-900">{course.price === 0 ? 'Free' : `${course.currency} ${course.price}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Modules</span>
              <span className="font-medium text-gray-900">{modules.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Lessons</span>
              <span className="font-medium text-gray-900">{modules.reduce((s, m) => s + m.lessons.length, 0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
            <button onClick={saveCourse} disabled={saving} className="btn-secondary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button onClick={publishCourse} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '🚀'}
              Publish Course
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
