'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusCircle, Trash2, GripVertical, Save, ArrowLeft, Video, FileText,
  HelpCircle, Paperclip, ChevronDown, ChevronRight, Loader2, Globe,
  EyeOff, BookOpen, Link2, Type, AlignLeft, Lock, Unlock, Upload,
  X, ChevronUp
} from 'lucide-react'
import Link from 'next/link'
import QuizBuilder from '@/components/admin/QuizBuilder'
import FileUpload from '@/components/ui/FileUpload'
import { slugify } from '@/lib/utils'

const LESSON_TYPES = [
  { value: 'text_header', label: 'Text Header', icon: Type, desc: 'Day/section heading (no content)' },
  { value: 'page', label: 'Page / Topic', icon: AlignLeft, desc: 'Text content for a topic' },
  { value: 'video', label: 'Video', icon: Video, desc: 'YouTube, Vimeo or direct URL' },
  { value: 'file', label: 'File / Document', icon: FileText, desc: 'PDF, PPTX, Word, ZIP etc.' },
  { value: 'url', label: 'External URL', icon: Link2, desc: 'Link to any external page' },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle, desc: 'Auto-graded quiz questions' },
  { value: 'assignment', label: 'Assignment', icon: Paperclip, desc: 'Submission task with brief' },
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
  const [uploadingLesson, setUploadingLesson] = useState<string | null>(null)
  const [quizLesson, setQuizLesson] = useState<{ id: string | null; title: string; tempKey: string } | null>(null)
  const [savedLessonIds, setSavedLessonIds] = useState<Record<string, string>>({})

  const [info, setInfo] = useState({
    title: '', slug: '', short_description: '', description: '',
    category_id: '', difficulty: 'beginner', duration_weeks: 12,
    price: 0, currency: 'NGN', certificate_enabled: true,
    what_you_learn: [''], requirements: [''], tags: '',
  })

  const [modules, setModules] = useState([{
    id: null as string | null,
    title: 'Module 1: Introduction',
    position: 0,
    prerequisite_module_index: null as number | null,
    lessons: [{
      id: null as string | null,
      title: '', type: 'video', video_url: '', external_url: '',
      content: '', file_url: '', file_name: '', is_preview: false,
      video_duration: 0
    }]
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
    setSaving(true) // use saving as loading indicator
    try {
      const [courseRes, modsRes] = await Promise.all([
        fetch(`/api/instructor/courses/${courseId}`).then(r => r.json()),
        fetch(`/api/instructor/courses/${courseId}/modules`).then(r => r.json()),
      ])
      if (courseRes.data) {
        const c = courseRes.data
        setInfo({
          title: c.title || '', slug: c.slug || '', short_description: c.short_description || '',
          description: c.description || '', category_id: c.category_id || '',
          difficulty: c.difficulty || 'beginner', duration_weeks: Number(c.duration_weeks) || 12,
          price: Number(c.price) || 0, currency: c.currency || 'NGN',
          certificate_enabled: c.certificate_enabled ?? true,
          what_you_learn: Array.isArray(c.what_you_learn) && c.what_you_learn.length ? c.what_you_learn : [''],
          requirements: Array.isArray(c.requirements) && c.requirements.length ? c.requirements : [''],
          tags: Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || ''),
        })
      }
      // Always reset modules — even if empty
      const blankLesson = { id: null as string | null, title: '', type: 'video', video_url: '', external_url: '', content: '', file_url: '', file_name: '', is_preview: false, video_duration: 0 }
      if (modsRes.data?.length) {
        setModules(modsRes.data.map((m: any, mi: number) => ({
          id: m.id, title: m.title || `Module ${mi + 1}`, position: mi,
          prerequisite_module_index: null,
          lessons: m.lessons?.length ? m.lessons.map((l: any) => ({
            id: l.id || null, title: l.title || '', type: l.type || 'video',
            video_url: l.video_url || '', external_url: l.external_url || '',
            content: l.content || '', file_url: l.file_url || '',
            file_name: l.file_name || '', is_preview: Boolean(l.is_preview),
            video_duration: Number(l.video_duration) || 0,
          })) : [{ ...blankLesson }]
        })))
      } else {
        setModules([{ id: null, title: 'Module 1: Introduction', position: 0, prerequisite_module_index: null, lessons: [{ ...blankLesson }] }])
      }
      setExpandedModules(new Set([0]))
    } catch (err) {
      console.error('Failed to load course:', err)
      alert('Failed to load course. Please try again.')
    } finally {
      setSaving(false)
    }
    setTab('info')
  }

  function newCourse() {
    setSelectedCourseId(null)
    setInfo({ title: '', slug: '', short_description: '', description: '', category_id: '', difficulty: 'beginner', duration_weeks: 12, price: 0, currency: 'NGN', certificate_enabled: true, what_you_learn: [''], requirements: [''], tags: '' })
    setModules([{ id: null, title: 'Module 1: Introduction', position: 0, prerequisite_module_index: null, lessons: [{ id: null, title: '', type: 'video', video_url: '', external_url: '', content: '', file_url: '', file_name: '', is_preview: false, video_duration: 0 }] }])
    setTab('info')
  }


  async function saveCourse(publish = false) {
    if (!info.title) { alert('Please enter a course title'); return }
    setSaving(true)
    const tags = info.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    const body = {
      ...info, tags,
      requirements: info.requirements.filter(Boolean),
      what_you_learn: info.what_you_learn.filter(Boolean),
      status: publish ? 'published' : 'draft',
      modules,
      ...(selectedCourseId ? { id: selectedCourseId } : {}),
    }
    try {
      const res = await fetch('/api/admin/course-builder', {
        method: selectedCourseId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json())

      if (res.error) { alert('Save failed: ' + res.error); setSaving(false); return }

      if (res.data) {
        const newId = res.data.id
        setSelectedCourseId(newId)
        const crs = await fetch('/api/admin/course-builder').then(r => r.json())
        setCourses(crs.data || [])
        if (publish) { router.push('/admin/courses'); return }
        // Reload so lesson IDs are populated (needed for quiz builder)
        await loadCourse(newId)
      }
    } catch (err) {
      alert('Save failed. Please check your connection and try again.')
    }
    setSaving(false)
  }

  async function handleFileUpload(mi: number, li: number, file: File) {
    const key = `${mi}-${li}`
    setUploadingLesson(key)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData }).then(r => r.json())
      if (res.url) {
        updLesson(mi, li, 'file_url', res.url)
        updLesson(mi, li, 'file_name', file.name)
        updLesson(mi, li, 'title', file.name.replace(/\.[^/.]+$/, ''))
      }
    } catch (e) {
      alert('Upload failed. Please paste a URL instead.')
    }
    setUploadingLesson(null)
  }

  const upd = (k: string, v: any) => setInfo(f => ({ ...f, [k]: v, ...(k === 'title' && !selectedCourseId ? { slug: slugify(v) } : {}) }))
  const updList = (field: 'what_you_learn' | 'requirements', i: number, v: string) => { const a = [...info[field]]; a[i] = v; upd(field, a) }
  const addMod = () => setModules(m => [...m, { id: null, title: `Module ${m.length + 1}`, position: m.length, prerequisite_module_index: null, lessons: [{ id: null, title: '', type: 'video', video_url: '', external_url: '', content: '', file_url: '', file_name: '', is_preview: false, video_duration: 0 }] }])
  const updMod = (mi: number, k: string, v: any) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, [k]: v } : mod))
  const moveMod = (mi: number, dir: -1 | 1) => {
    const newMods = [...modules]
    const target = mi + dir
    if (target < 0 || target >= newMods.length) return
    ;[newMods[mi], newMods[target]] = [newMods[target], newMods[mi]]
    setModules(newMods)
  }
  const removeMod = (mi: number) => setModules(m => m.filter((_, i) => i !== mi))
  const addLesson = (mi: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: [...mod.lessons, { id: null, title: '', type: 'video', video_url: '', external_url: '', content: '', file_url: '', file_name: '', is_preview: false, video_duration: 0 }] } : mod))
  const updLesson = (mi: number, li: number, k: string, v: any) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: mod.lessons.map((l, j) => j === li ? { ...l, [k]: typeof v === 'function' ? v(l[k as keyof typeof l]) : v } : l) } : mod))
  const removeLesson = (mi: number, li: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== li) } : mod))
  const toggleMod = (i: number) => setExpandedModules(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Course Builder</h1>
            <p className="text-sm text-gray-400">{selectedCourseId ? info.title || 'Editing course' : tab === 'select' ? 'Select or create' : 'New course'}</p>
          </div>
        </div>
        {tab !== 'select' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setTab('select')} className="btn-secondary text-sm flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />All Courses</button>
            <button onClick={() => saveCourse(false)} disabled={saving} className="btn-secondary text-sm flex items-center gap-1.5">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save Draft</button>
            <button onClick={() => saveCourse(true)} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Publish</button>
          </div>
        )}
      </div>

      {/* Select course */}
      {tab === 'select' && (
        <div className="space-y-4">
          <button onClick={newCourse} className="btn-primary flex items-center gap-2 w-full justify-center py-3"><PlusCircle className="w-4 h-4" />Create New Course</button>
          {courses.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-600">Existing Courses — click to edit</div>
              {courses.map((c: any) => (
                <button key={c.id} onClick={() => loadCourse(c.id)} className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 text-left last:border-0">
                  <div className="w-10 h-10 bloomy-gradient rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{c.title?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{c.total_lessons || 0} lessons · {c.difficulty}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${c.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{c.status}</span>
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
              <button key={id} onClick={() => setTab(id as any)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{label}</button>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label>
                  <textarea value={info.description} onChange={e => upd('description', e.target.value)} rows={5} className={inp + ' resize-none'} placeholder="Detailed course description..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
                  <select value={info.difficulty} onChange={e => upd('difficulty', e.target.value)} className={inp}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (weeks)</label>
                  <input type="number" value={info.duration_weeks} onChange={e => upd('duration_weeks', parseInt(e.target.value))} className={inp} min={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₦)</label>
                  <input type="number" value={info.price} onChange={e => upd('price', parseFloat(e.target.value) || 0)} className={inp} min={0} placeholder="0 = Free" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select value={info.currency} onChange={e => upd('currency', e.target.value)} className={inp}>
                    {['NGN', 'USD', 'GBP'].map(c => <option key={c} value={c}>{c}</option>)}
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
                    <input value={item} onChange={e => updList('what_you_learn', i, e.target.value)} className={inp} placeholder={`Outcome ${i + 1}`} />
                    {info.what_you_learn.length > 1 && <button onClick={() => upd('what_you_learn', info.what_you_learn.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 p-1.5"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
                <button onClick={() => upd('what_you_learn', [...info.what_you_learn, ''])} className="text-sm text-bloomy-600 flex items-center gap-1 mt-1"><PlusCircle className="w-3.5 h-3.5" />Add outcome</button>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={info.certificate_enabled} onChange={e => upd('certificate_enabled', e.target.checked)} className="w-4 h-4 accent-bloomy-600" />
                  <span className="font-medium text-gray-700">Issue certificates on completion</span>
                </label>
              </div>
              <div className="flex justify-end"><button onClick={() => setTab('curriculum')} className="btn-primary">Next: Build Curriculum →</button></div>
            </div>
          )}

          {tab === 'curriculum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Modules & Lessons</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{modules.reduce((s, m) => s + m.lessons.length, 0)} lessons across {modules.length} modules</p>
                </div>
                <button onClick={addMod} className="btn-secondary text-sm flex items-center gap-1.5"><PlusCircle className="w-4 h-4" />Add Module</button>
              </div>

              {modules.map((mod, mi) => (
                <div key={mi} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {/* Module header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <input value={mod.title} onChange={e => updMod(mi, 'title', e.target.value)} className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none min-w-0" placeholder="Module title" onClick={e => e.stopPropagation()} />
                    {/* Prerequisites */}
                    {mi > 0 && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                        <select
                          value={mod.prerequisite_module_index ?? ''}
                          onChange={e => updMod(mi, 'prerequisite_module_index', e.target.value ? parseInt(e.target.value) : null)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white max-w-[140px]"
                          title="Prerequisite module">
                          <option value="">No prerequisite</option>
                          {modules.filter((_, i) => i < mi).map((m, i) => (
                            <option key={i} value={i}>After: {m.title.slice(0, 20)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => moveMod(mi, -1)} disabled={mi === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5 text-gray-500" /></button>
                      <button onClick={() => moveMod(mi, 1)} disabled={mi === modules.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-gray-500" /></button>
                      <span className="text-xs text-gray-400">{mod.lessons.length} lessons</span>
                      <button onClick={() => removeMod(mi)} className="text-gray-300 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleMod(mi)} className="p-1 rounded hover:bg-gray-200">
                        {expandedModules.has(mi) ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                      </button>
                    </div>
                  </div>

                  {expandedModules.has(mi) && (
                    <div className="p-4 space-y-3">
                      {mod.lessons.map((lesson, li) => {
                        const typeInfo = LESSON_TYPES.find(t => t.value === lesson.type) || LESSON_TYPES[2]
                        const uploadKey = `${mi}-${li}`
                        const isHeader = lesson.type === 'text_header'

                        return (
                          <div key={li} className={`border rounded-xl overflow-hidden ${isHeader ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-100'}`}>
                            {/* Lesson top row */}
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-white/80">
                              <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                              <select value={lesson.type} onChange={e => updLesson(mi, li, 'type', e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer flex-shrink-0">
                                {LESSON_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                              <input value={lesson.title} onChange={e => updLesson(mi, li, 'title', e.target.value)}
                                className={`flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400 min-w-0 ${isHeader ? 'font-semibold border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}
                                placeholder={isHeader ? 'Section heading text...' : 'Lesson title'} />
                              {!isHeader && (
                                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer flex-shrink-0">
                                  <input type="checkbox" checked={lesson.is_preview} onChange={e => updLesson(mi, li, 'is_preview', e.target.checked)} className="accent-bloomy-600" />
                                  Preview
                                </label>
                              )}
                              {mod.lessons.length > 1 && (
                                <button onClick={() => removeLesson(mi, li)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </div>

                            {/* Content area based on type */}
                            {!isHeader && (
                              <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-100">
                                {lesson.type === 'video' && (
                                  <div className="flex items-center gap-2">
                                    <Video className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <input value={lesson.video_url} onChange={e => updLesson(mi, li, 'video_url', e.target.value)}
                                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400"
                                      placeholder="YouTube URL, Vimeo URL, or direct video URL" />
                                    <input type="number" value={lesson.video_duration} onChange={e => updLesson(mi, li, 'video_duration', parseInt(e.target.value) || 0)}
                                      className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" placeholder="Secs" min={0} />
                                  </div>
                                )}

                                {lesson.type === 'url' && (
                                  <div className="flex items-center gap-2">
                                    <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <input value={lesson.external_url} onChange={e => updLesson(mi, li, 'external_url', e.target.value)}
                                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400"
                                      placeholder="https://any-external-link.com" />
                                  </div>
                                )}

                                {lesson.type === 'file' && (
                                  <div className="pt-1">
                                    <FileUpload
                                      value={lesson.file_url || ''}
                                      fileName={lesson.file_name}
                                      onChange={(url, name, size) => {
                                        updLesson(mi, li, 'file_url', url)
                                        updLesson(mi, li, 'file_name', name)
                                        if (size) updLesson(mi, li, 'video_duration', size)
                                        if (!lesson.title && name) updLesson(mi, li, 'title', name.replace(/\.[^/.]+$/, ''))
                                      }}
                                    />
                                  </div>
                                )}

                                {lesson.type === 'quiz' && (
                                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                                    <p className="text-xs text-purple-700">Click to build quiz questions after saving the course</p>
                                    {lesson.id && (
                                      <button
                                        type="button"
                                        onClick={() => setQuizLesson({ id: lesson.id, title: lesson.title || 'Quiz', tempKey: `${mi}-${li}` })}
                                        className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 font-medium flex items-center gap-1">
                                        <HelpCircle className="w-3.5 h-3.5" />Build Quiz
                                      </button>
                                    )}
                                    {!lesson.id && <p className="text-xs text-purple-500">Save course first to add questions</p>}
                                  </div>
                                )}
                                {(lesson.type === 'page' || lesson.type === 'assignment') && (
                                  <textarea value={lesson.content} onChange={e => updLesson(mi, li, 'content', e.target.value)}
                                    rows={4} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-bloomy-400 resize-none"
                                    placeholder={lesson.type === 'assignment' ? 'Assignment brief, instructions, submission details...' : 'Topic content (HTML supported for rich text)...'} />
                                )}
                                {lesson.type === 'quiz' && (
                                  <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl p-3">
                                    <HelpCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    <p className="text-xs text-purple-700 flex-1">
                                      {selectedCourseId && lesson.id
                                        ? 'Quiz saved — click Edit to manage questions'
                                        : 'Save the course first, then edit quiz questions'}
                                    </p>
                                    {selectedCourseId && lesson.id && (
                                      <button
                                        onClick={() => setQuizLesson({ id: lesson.id!, title: lesson.title || 'Quiz', tempKey: `-` })}
                                        className="text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex-shrink-0">
                                        Edit Quiz
                                      </button>
                                    )}
                                    {!lesson.id && (
                                      <button
                                        onClick={() => saveCourse(false)}
                                        className="text-xs font-semibold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex-shrink-0">
                                        Save First
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <button onClick={() => addLesson(mi)}
                        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 flex items-center justify-center gap-1.5 transition-colors">
                        <PlusCircle className="w-3.5 h-3.5" />Add Lesson
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {quizLesson && (
        <QuizBuilder
          lessonId={quizLesson.id || ''}
          lessonTitle={quizLesson.title}
          onClose={() => setQuizLesson(null)}
        />
      )}
    </div>
  )
}
