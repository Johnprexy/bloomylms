'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2, GripVertical, Save, ArrowLeft, Video, FileText, HelpCircle, Paperclip, ChevronDown, ChevronRight, Loader2, Globe, EyeOff, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'

const LESSON_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'text', label: 'Text / Article', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
  { value: 'assignment', label: 'Assignment', icon: Paperclip },
]

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

export default function CourseBuilderPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [tab, setTab] = useState<'select' | 'info' | 'curriculum'>('select')
  const [saving, setSaving] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]))

  const [info, setInfo] = useState({
    title: '', slug: '', short_description: '', description: '',
    category_id: '', difficulty: 'beginner', duration_weeks: 12,
    price: 0, currency: 'NGN', certificate_enabled: true,
    what_you_learn: [''], requirements: [''], tags: '',
  })

  const [modules, setModules] = useState([{
    id: null as string | null, title: 'Module 1: Introduction', position: 0,
    lessons: [{ id: null as string | null, title: '', type: 'video', video_url: '', content: '', is_preview: false, video_duration: 0 }]
  }])

  useEffect(() => {
    Promise.all([
      fetch('/api/courses/categories').then(r => r.json()),
      fetch('/api/admin/course-builder').then(r => r.json()),
    ]).then(([cats, crs]) => {
      setCategories(cats.data || [])
      setCourses(crs.data || [])
    })
  }, [])

  async function loadCourse(courseId: string) {
    setSelectedCourseId(courseId)
    const [courseRes, modsRes] = await Promise.all([
      fetch(`/api/instructor/courses/${courseId}`).then(r => r.json()),
      fetch(`/api/instructor/courses/${courseId}/modules`).then(r => r.json()),
    ])
    if (courseRes.data) {
      const c = courseRes.data
      setInfo({
        title: c.title || '', slug: c.slug || '', short_description: c.short_description || '',
        description: c.description || '', category_id: c.category_id || '',
        difficulty: c.difficulty || 'beginner', duration_weeks: c.duration_weeks || 12,
        price: c.price || 0, currency: c.currency || 'NGN', certificate_enabled: c.certificate_enabled ?? true,
        what_you_learn: c.what_you_learn?.length ? c.what_you_learn : [''],
        requirements: c.requirements?.length ? c.requirements : [''],
        tags: Array.isArray(c.tags) ? c.tags.join(', ') : '',
      })
    }
    if (modsRes.data?.length) {
      setModules(modsRes.data.map((m: any, mi: number) => ({
        id: m.id, title: m.title, position: mi,
        lessons: m.lessons?.length ? m.lessons.map((l: any) => ({
          id: l.id, title: l.title || '', type: l.type || 'video',
          video_url: l.video_url || '', content: l.content || '',
          is_preview: l.is_preview || false, video_duration: l.video_duration || 0,
        })) : [{ id: null, title: '', type: 'video', video_url: '', content: '', is_preview: false, video_duration: 0 }]
      })))
      setExpandedModules(new Set([0]))
    }
    setTab('info')
  }

  function newCourse() {
    setSelectedCourseId(null)
    setInfo({ title: '', slug: '', short_description: '', description: '', category_id: '', difficulty: 'beginner', duration_weeks: 12, price: 0, currency: 'NGN', certificate_enabled: true, what_you_learn: [''], requirements: [''], tags: '' })
    setModules([{ id: null, title: 'Module 1: Introduction', position: 0, lessons: [{ id: null, title: '', type: 'video', video_url: '', content: '', is_preview: false, video_duration: 0 }] }])
    setTab('info')
  }

  async function saveCourse(publish = false) {
    setSaving(true)
    const tags = info.tags.split(',').map(t => t.trim()).filter(Boolean)
    const body = {
      ...info, tags,
      requirements: info.requirements.filter(Boolean),
      what_you_learn: info.what_you_learn.filter(Boolean),
      status: publish ? 'published' : 'draft',
      modules,
      ...(selectedCourseId ? { id: selectedCourseId } : {}),
    }
    const res = await fetch('/api/admin/course-builder', {
      method: selectedCourseId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json())
    setSaving(false)
    if (res.data) {
      setSelectedCourseId(res.data.id)
      const crs = await fetch('/api/admin/course-builder').then(r => r.json())
      setCourses(crs.data || [])
      if (publish) router.push('/admin/courses')
    }
  }

  const upd = (k: string, v: any) => setInfo(f => ({ ...f, [k]: v, ...(k === 'title' && !selectedCourseId ? { slug: slugify(v) } : {}) }))
  const updList = (field: 'what_you_learn' | 'requirements', i: number, v: string) => { const a = [...info[field]]; a[i] = v; upd(field, a) }
  const addMod = () => setModules(m => [...m, { id: null, title: `Module ${m.length + 1}`, position: m.length, lessons: [{ id: null, title: '', type: 'video', video_url: '', content: '', is_preview: false, video_duration: 0 }] }])
  const updMod = (mi: number, k: string, v: string) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, [k]: v } : mod))
  const addLesson = (mi: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: [...mod.lessons, { id: null, title: '', type: 'video', video_url: '', content: '', is_preview: false, video_duration: 0 }] } : mod))
  const updLesson = (mi: number, li: number, k: string, v: any) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: mod.lessons.map((l, j) => j === li ? { ...l, [k]: v } : l) } : mod))
  const removeLesson = (mi: number, li: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== li) } : mod))
  const toggleMod = (i: number) => setExpandedModules(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 focus:border-transparent'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Course Builder</h1>
            <p className="text-sm text-gray-400">{selectedCourseId ? `Editing: ${info.title}` : tab === 'select' ? 'Select or create a course' : 'New course'}</p>
          </div>
        </div>
        {tab !== 'select' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setTab('select')} className="btn-secondary text-sm flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />All Courses</button>
            <button onClick={() => saveCourse(false)} disabled={saving} className="btn-secondary text-sm flex items-center gap-1.5">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save Draft</button>
            <button onClick={() => saveCourse(true)} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Publish</button>
          </div>
        )}
      </div>

      {tab === 'select' && (
        <div className="space-y-4">
          <button onClick={newCourse} className="btn-primary flex items-center gap-2 w-full justify-center py-3"><PlusCircle className="w-4 h-4" />Create New Course</button>
          {courses.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-700">Existing Courses — click to edit</div>
              {courses.map((c: any) => (
                <button key={c.id} onClick={() => loadCourse(c.id)} className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 text-left transition-colors last:border-0">
                  <div className="w-10 h-10 bloomy-gradient rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{c.title.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{c.total_lessons || 0} lessons · {c.difficulty}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{c.status}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(tab === 'info' || tab === 'curriculum') && (
        <>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
            {[['info', 'Course Info'], ['curriculum', 'Curriculum']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id as any)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
            ))}
          </div>

          {tab === 'info' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title *</label>
                  <input value={info.title} onChange={e => upd('title', e.target.value)} className={inp} placeholder="e.g. Linux, DevOps & Cloud Engineering" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label>
                  <input value={info.slug} onChange={e => upd('slug', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select value={info.category_id} onChange={e => upd('category_id', e.target.value)} className={inp}>
                    <option value="">Select category...</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                  <textarea value={info.short_description} onChange={e => upd('short_description', e.target.value)} rows={2} className={inp + ' resize-none'} placeholder="One-line summary shown on course cards" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description *</label>
                  <textarea value={info.description} onChange={e => upd('description', e.target.value)} rows={5} className={inp + ' resize-none'} placeholder="Detailed course description..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
                  <select value={info.difficulty} onChange={e => upd('difficulty', e.target.value)} className={inp}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (weeks)</label>
                  <input type="number" value={info.duration_weeks} onChange={e => upd('duration_weeks', parseInt(e.target.value))} className={inp} min={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₦)</label>
                  <input type="number" value={info.price} onChange={e => upd('price', parseFloat(e.target.value))} className={inp} min={0} placeholder="0 for free" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select value={info.currency} onChange={e => upd('currency', e.target.value)} className={inp}>
                    {['NGN','USD','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma separated)</label>
                  <input value={info.tags} onChange={e => upd('tags', e.target.value)} className={inp} placeholder="AWS, Docker, Kubernetes, Jenkins" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What students will learn</label>
                {info.what_you_learn.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={item} onChange={e => updList('what_you_learn', i, e.target.value)} className={inp} placeholder={`Learning outcome ${i+1}`} />
                    {info.what_you_learn.length > 1 && <button onClick={() => upd('what_you_learn', info.what_you_learn.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
                <button onClick={() => upd('what_you_learn', [...info.what_you_learn, ''])} className="text-sm text-bloomy-600 flex items-center gap-1 mt-1"><PlusCircle className="w-3.5 h-3.5" />Add outcome</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                {info.requirements.map((item, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={item} onChange={e => updList('requirements', i, e.target.value)} className={inp} placeholder={`Requirement ${i+1}`} />
                    {info.requirements.length > 1 && <button onClick={() => upd('requirements', info.requirements.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
                <button onClick={() => upd('requirements', [...info.requirements, ''])} className="text-sm text-bloomy-600 flex items-center gap-1 mt-1"><PlusCircle className="w-3.5 h-3.5" />Add requirement</button>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={info.certificate_enabled} onChange={e => upd('certificate_enabled', e.target.checked)} className="w-4 h-4 accent-bloomy-600" />
                  <span className="font-medium text-gray-700">Issue certificates on completion</span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setTab('curriculum')} className="btn-primary">Next: Build Curriculum →</button>
              </div>
            </div>
          )}

          {tab === 'curriculum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Modules & Lessons</h2>
                  <p className="text-sm text-gray-400">{modules.reduce((s, m) => s + m.lessons.length, 0)} lessons across {modules.length} modules</p>
                </div>
                <button onClick={addMod} className="btn-secondary text-sm flex items-center gap-1.5"><PlusCircle className="w-4 h-4" />Add Module</button>
              </div>

              {modules.map((mod, mi) => (
                <div key={mi} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer" onClick={() => toggleMod(mi)}>
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <input value={mod.title} onChange={e => { e.stopPropagation(); updMod(mi, 'title', e.target.value) }} onClick={e => e.stopPropagation()} className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none" placeholder="Module title" />
                    <span className="text-xs text-gray-400 flex-shrink-0">{mod.lessons.length} lessons</span>
                    {expandedModules.has(mi) ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>

                  {expandedModules.has(mi) && (
                    <div className="p-4 space-y-3">
                      {mod.lessons.map((lesson, li) => {
                        const LessonIcon = LESSON_TYPES.find(t => t.value === lesson.type)?.icon || Video
                        return (
                          <div key={li} className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50/50">
                              <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                              <select value={lesson.type} onChange={e => updLesson(mi, li, 'type', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer">
                                {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                              <input value={lesson.title} onChange={e => updLesson(mi, li, 'title', e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400" placeholder="Lesson title" />
                              <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer flex-shrink-0">
                                <input type="checkbox" checked={lesson.is_preview} onChange={e => updLesson(mi, li, 'is_preview', e.target.checked)} className="accent-bloomy-600" />Preview
                              </label>
                              {mod.lessons.length > 1 && <button onClick={() => removeLesson(mi, li)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>}
                            </div>
                            <div className="px-3 pb-3 pt-2 space-y-2">
                              {lesson.type === 'video' && (
                                <div className="flex items-center gap-2">
                                  <Video className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <input value={lesson.video_url} onChange={e => updLesson(mi, li, 'video_url', e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400" placeholder="Video URL (YouTube, Vimeo, etc.)" />
                                  <input type="number" value={lesson.video_duration} onChange={e => updLesson(mi, li, 'video_duration', parseInt(e.target.value))} className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" placeholder="Secs" min={0} />
                                </div>
                              )}
                              {(lesson.type === 'text' || lesson.type === 'assignment') && (
                                <textarea value={lesson.content} onChange={e => updLesson(mi, li, 'content', e.target.value)} rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-bloomy-400 resize-none" placeholder={lesson.type === 'assignment' ? 'Assignment brief and instructions...' : 'Lesson content (HTML or markdown supported)...'} />
                              )}
                            </div>
                          </div>
                        )
                      })}
                      <button onClick={() => addLesson(mi)} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 flex items-center justify-center gap-1.5 transition-colors"><PlusCircle className="w-3.5 h-3.5" />Add Lesson</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
