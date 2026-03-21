'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlusCircle, Trash2, GripVertical, Save, ArrowLeft, Video, FileText,
  HelpCircle, Paperclip, ChevronDown, ChevronRight, Loader2, Globe,
  BookOpen, Link2, Type, AlignLeft, Upload, X, ChevronUp, MessageSquare,
  CheckCircle, AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import QuizBuilder from '@/components/admin/QuizBuilder'
import FileUpload from '@/components/ui/FileUpload'
import { slugify } from '@/lib/utils'

const LESSON_TYPES = [
  { value: 'text_header', label: 'Text Header', icon: Type },
  { value: 'page',        label: 'Page',        icon: AlignLeft },
  { value: 'video',       label: 'Video',       icon: Video },
  { value: 'file',        label: 'File',        icon: FileText },
  { value: 'url',         label: 'URL',         icon: Link2 },
  { value: 'quiz',        label: 'Quiz',        icon: HelpCircle },
  { value: 'assignment',  label: 'Assignment',  icon: Paperclip },
  { value: 'survey',      label: 'Survey',      icon: MessageSquare },
]

const emptyLesson = () => ({ id: null as string | null, title: '', type: 'video', video_url: '', external_url: '', content: '', file_url: '', file_name: '', is_preview: false, video_duration: 0 })
const emptyModule = (n: number) => ({ id: null as string | null, title: `Module ${n}`, position: n - 1, prerequisite_module_index: null as number | null, lessons: [emptyLesson()] })

export default function CourseBuilderPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [tab, setTab] = useState<'select' | 'info' | 'curriculum'>('select')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]))
  const [quizLesson, setQuizLesson] = useState<{ id: string; title: string } | null>(null)

  const [info, setInfo] = useState({
    title: '', slug: '', short_description: '', description: '',
    category_id: '', difficulty: 'beginner', duration_weeks: 12,
    price: 0, currency: 'NGN', certificate_enabled: true,
    what_you_learn: [''], requirements: [''], tags: '',
  })

  const [modules, setModules] = useState([emptyModule(1)])

  useEffect(() => {
    Promise.all([
      fetch('/api/courses/categories').then(r => r.json()),
      fetch('/api/admin/course-builder').then(r => r.json()),
    ]).then(([cats, crs]) => {
      setCategories(cats.data || [])
      setCourses(crs.data || [])
    })
  }, [])

  async function loadCourse(courseId: string, keepTab = false) {
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
        price: c.price || 0, currency: c.currency || 'NGN',
        certificate_enabled: c.certificate_enabled ?? true,
        what_you_learn: c.what_you_learn?.length ? c.what_you_learn : [''],
        requirements: c.requirements?.length ? c.requirements : [''],
        tags: Array.isArray(c.tags) ? c.tags.join(', ') : (c.tags || ''),
      })
    }
    if (modsRes.data?.length) {
      setModules(modsRes.data.map((m: any, mi: number) => ({
        id: m.id, title: m.title, position: mi,
        prerequisite_module_index: null,
        lessons: m.lessons?.length ? m.lessons.map((l: any) => ({
          id: l.id, title: l.title || '', type: l.type || 'video',
          video_url: l.video_url || '', external_url: l.external_url || '',
          content: l.content || '', file_url: l.file_url || '',
          file_name: l.file_name || '', is_preview: l.is_preview || false,
          video_duration: l.video_duration || 0,
        })) : [emptyLesson()]
      })))
    }
    setSelectedCourseId(courseId)
    setExpandedModules(new Set([0]))
    if (!keepTab) setTab('info')
  }

  function newCourse() {
    setSelectedCourseId(null)
    setInfo({ title: '', slug: '', short_description: '', description: '', category_id: '', difficulty: 'beginner', duration_weeks: 12, price: 0, currency: 'NGN', certificate_enabled: true, what_you_learn: [''], requirements: [''], tags: '' })
    setModules([emptyModule(1)])
    setExpandedModules(new Set([0]))
    setTab('info')
    setSaveMsg(null)
  }

  async function saveCourse(publish = false) {
    // Validate title
    if (!info.title?.trim()) {
      setSaveMsg({ type: 'error', text: 'Please enter a course title on the Course Info tab' })
      setTab('info')
      return
    }

    setSaving(true)
    setSaveMsg(null)

    const currentTab = tab
    const tags = info.tags ? info.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []

    const body = {
      ...info,
      tags,
      requirements: (info.requirements || []).filter(Boolean),
      what_you_learn: (info.what_you_learn || []).filter(Boolean),
      status: publish ? 'published' : 'draft',
      modules,
      ...(selectedCourseId ? { id: selectedCourseId } : {}),
    }

    try {
      const response = await fetch('/api/admin/course-builder', {
        method: selectedCourseId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const res = await response.json()

      if (!response.ok || res.error) {
        setSaveMsg({ type: 'error', text: res.error || `Server error ${response.status}` })
        setSaving(false)
        return
      }

      if (res.data) {
        const newId = res.data.id
        setSelectedCourseId(newId)

        // Refresh course list in background
        fetch('/api/admin/course-builder').then(r => r.json()).then(crs => setCourses(crs.data || []))

        if (publish) {
          router.push('/admin/courses')
          return
        }

        // Update lesson IDs from DB without overwriting module content
        // Fetch just the modules to get real IDs for quiz builder
        const modsRes = await fetch(`/api/instructor/courses/${newId}/modules`).then(r => r.json())
        if (modsRes.data?.length) {
          setModules(prev => prev.map((mod: any, mi: number) => {
            const dbMod = modsRes.data[mi]
            if (!dbMod) return mod
            return {
              ...mod,
              id: dbMod.id,
              lessons: (mod.lessons || []).map((lesson: any, li: number) => {
                const dbLesson = dbMod.lessons?.[li]
                return dbLesson ? { ...lesson, id: dbLesson.id } : lesson
              })
            }
          }))
        }

        setTab(currentTab)
        setSaveMsg({ type: 'success', text: '✓ Saved!' })
        setTimeout(() => setSaveMsg(null), 4000)
      }
    } catch (err: any) {
      setSaveMsg({ type: 'error', text: 'Network error — ' + (err.message || 'please try again') })
    }

    setSaving(false)
  }

  // ── helpers ──
  const upd = (k: string, v: any) => setInfo(f => ({
    ...f, [k]: v,
    ...(k === 'title' && !selectedCourseId ? { slug: slugify(v) } : {})
  }))
  const addMod = () => { const n = modules.length + 1; setModules(m => [...m, emptyModule(n)]); setExpandedModules(s => new Set([...s, modules.length])) }
  const removeMod = (mi: number) => setModules(m => m.filter((_, i) => i !== mi))
  const moveMod = (mi: number, dir: -1 | 1) => { const a = [...modules]; const t = mi + dir; if (t < 0 || t >= a.length) return; [a[mi], a[t]] = [a[t], a[mi]]; setModules(a) }
  const updMod = (mi: number, k: string, v: any) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, [k]: v } : mod))
  const addLesson = (mi: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: [...mod.lessons, emptyLesson()] } : mod))
  const removeLesson = (mi: number, li: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== li) } : mod))
  const updLesson = (mi: number, li: number, k: string, v: any) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: mod.lessons.map((l, j) => j === li ? { ...l, [k]: v } : l) } : mod))
  const toggleMod = (i: number) => setExpandedModules(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  const updList = (field: 'what_you_learn' | 'requirements', i: number, v: string) => { const a = [...info[field]]; a[i] = v; upd(field, a) }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'
  const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0)

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap sticky top-0 bg-gray-50 py-3 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setTab('select')} className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Course Builder</h1>
            <p className="text-sm text-gray-400">{selectedCourseId ? (info.title || 'Editing') : tab === 'select' ? 'Select or create a course' : 'New course'}</p>
          </div>
        </div>
        {tab !== 'select' && (
          <div className="flex items-center gap-2 flex-wrap">
            {saveMsg && (
              <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-xl ${saveMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {saveMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {saveMsg.text}
              </div>
            )}
            <Link href="/admin/courses" className="btn-secondary text-sm flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />All Courses</Link>
            <button onClick={() => saveCourse(false)} disabled={saving}
              className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button onClick={() => saveCourse(true)} disabled={saving}
              className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-60">
              <Globe className="w-3.5 h-3.5" />Publish
            </button>
          </div>
        )}
      </div>

      {/* SELECT */}
      {tab === 'select' && (
        <div className="space-y-4">
          <button onClick={newCourse} className="btn-primary flex items-center gap-2 w-full justify-center py-3.5 text-sm">
            <PlusCircle className="w-4 h-4" />Create New Course
          </button>
          {courses.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 text-sm font-semibold text-gray-500">Existing Courses</div>
              {courses.map((c: any) => (
                <button key={c.id} onClick={() => loadCourse(c.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 text-left last:border-0">
                  <div className="w-10 h-10 bloomy-gradient rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {c.title?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{c.total_lessons || 0} lessons · {c.difficulty}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${c.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                    {c.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(tab === 'info' || tab === 'curriculum') && (
        <>
          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
            {[['info', 'Course Info'], ['curriculum', 'Curriculum']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id as any)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {/* COURSE INFO */}
          {tab === 'info' && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course Title *</label>
                  <input value={info.title} onChange={e => upd('title', e.target.value)} className={inp} placeholder="e.g. Linux, DevOps & Cloud Engineering" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">URL Slug</label>
                  <input value={info.slug} onChange={e => upd('slug', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                  <select value={info.category_id} onChange={e => upd('category_id', e.target.value)} className={inp + ' appearance-none'}>
                    <option value="">Select category...</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Short Description</label>
                  <textarea value={info.short_description} onChange={e => upd('short_description', e.target.value)} rows={2} className={inp + ' resize-none'} placeholder="One-line summary shown on course cards" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Description</label>
                  <textarea value={info.description} onChange={e => upd('description', e.target.value)} rows={4} className={inp + ' resize-none'} placeholder="Detailed course description..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Difficulty</label>
                  <select value={info.difficulty} onChange={e => upd('difficulty', e.target.value)} className={inp + ' appearance-none'}>
                    {['beginner','intermediate','advanced'].map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (weeks)</label>
                  <input type="number" value={info.duration_weeks} onChange={e => upd('duration_weeks', parseInt(e.target.value))} className={inp} min={1} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Price (₦)</label>
                  <input type="number" value={info.price} onChange={e => upd('price', parseFloat(e.target.value) || 0)} className={inp} min={0} placeholder="0 = Free" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tags (comma separated)</label>
                  <input value={info.tags} onChange={e => upd('tags', e.target.value)} className={inp} placeholder="AWS, Docker, Linux" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">What students will learn</label>
                  {info.what_you_learn.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={item} onChange={e => updList('what_you_learn', i, e.target.value)} className={inp} placeholder={`Outcome ${i + 1}`} />
                      {info.what_you_learn.length > 1 && <button onClick={() => upd('what_you_learn', info.what_you_learn.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => upd('what_you_learn', [...info.what_you_learn, ''])} className="text-sm text-bloomy-600 flex items-center gap-1 mt-1"><PlusCircle className="w-3.5 h-3.5" />Add outcome</button>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 sm:col-span-2">
                  <input type="checkbox" id="cert" checked={info.certificate_enabled} onChange={e => upd('certificate_enabled', e.target.checked)} className="w-4 h-4 accent-bloomy-600" />
                  <label htmlFor="cert" className="text-sm font-medium text-gray-700 cursor-pointer">Issue certificates on completion</label>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => {
                  if (!info.title.trim()) { setSaveMsg({ type: 'error', text: 'Enter a course title first' }); return }
                  setTab('curriculum')
                }} className="btn-primary">
                  Next: Build Curriculum →
                </button>
              </div>
            </div>
          )}

          {/* CURRICULUM */}
          {tab === 'curriculum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Modules & Lessons</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{totalLessons} lessons across {modules.length} module{modules.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={addMod} className="btn-secondary text-sm flex items-center gap-1.5"><PlusCircle className="w-4 h-4" />Add Module</button>
              </div>

              {modules.map((mod, mi) => (
                <div key={mi} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {/* Module header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <input value={mod.title} onChange={e => updMod(mi, 'title', e.target.value)}
                      className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none min-w-0"
                      placeholder="Module title" onClick={e => e.stopPropagation()} />
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => moveMod(mi, -1)} disabled={mi === 0} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5 text-gray-500" /></button>
                      <button onClick={() => moveMod(mi, 1)} disabled={mi === modules.length - 1} className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5 text-gray-500" /></button>
                      <span className="text-xs text-gray-400 px-1">{mod.lessons.length} lessons</span>
                      <button onClick={() => removeMod(mi)} className="text-gray-300 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toggleMod(mi)} className="p-1 rounded hover:bg-gray-200">
                        {expandedModules.has(mi) ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                      </button>
                    </div>
                  </div>

                  {expandedModules.has(mi) && (
                    <div className="p-4 space-y-3">
                      {mod.lessons.map((lesson, li) => {
                        const isHeader = lesson.type === 'text_header'
                        const typeInfo = LESSON_TYPES.find(t => t.value === lesson.type) || LESSON_TYPES[2]

                        return (
                          <div key={li} className={`border rounded-xl overflow-hidden ${isHeader ? 'border-yellow-200 bg-yellow-50/40' : 'border-gray-100'}`}>
                            {/* Lesson row */}
                            <div className="flex items-center gap-2 px-3 py-2.5">
                              <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                              <select value={lesson.type}
                                onChange={e => updLesson(mi, li, 'type', e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white cursor-pointer flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-bloomy-500">
                                {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                              </select>
                              <input value={lesson.title}
                                onChange={e => updLesson(mi, li, 'title', e.target.value)}
                                className={`flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400 min-w-0 ${isHeader ? 'font-semibold border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}
                                placeholder={isHeader ? 'Section heading...' : 'Lesson title'} />
                              {!isHeader && (
                                <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer flex-shrink-0">
                                  <input type="checkbox" checked={lesson.is_preview} onChange={e => updLesson(mi, li, 'is_preview', e.target.checked)} className="accent-bloomy-600" />
                                  Preview
                                </label>
                              )}
                              {mod.lessons.length > 1 && (
                                <button onClick={() => removeLesson(mi, li)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </div>

                            {/* Lesson content area */}
                            {!isHeader && (
                              <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
                                {/* VIDEO */}
                                {lesson.type === 'video' && (
                                  <div className="flex items-center gap-2 pt-2">
                                    <input value={lesson.video_url} onChange={e => updLesson(mi, li, 'video_url', e.target.value)}
                                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400"
                                      placeholder="YouTube URL, Vimeo URL, or direct video link" />
                                  </div>
                                )}
                                {/* URL */}
                                {lesson.type === 'url' && (
                                  <div className="flex items-center gap-2 pt-2">
                                    <input value={lesson.external_url} onChange={e => updLesson(mi, li, 'external_url', e.target.value)}
                                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400"
                                      placeholder="https://any-link.com" />
                                  </div>
                                )}
                                {/* FILE */}
                                {lesson.type === 'file' && (
                                  <div className="pt-2">
                                    <FileUpload
                                      value={lesson.file_url || ''}
                                      fileName={lesson.file_name}
                                      onChange={(url, name) => {
                                        updLesson(mi, li, 'file_url', url)
                                        updLesson(mi, li, 'file_name', name)
                                        if (!lesson.title && name) updLesson(mi, li, 'title', name.replace(/\.[^/.]+$/, ''))
                                      }}
                                    />
                                  </div>
                                )}
                                {/* PAGE */}
                                {lesson.type === 'page' && (
                                  <textarea value={lesson.content} onChange={e => updLesson(mi, li, 'content', e.target.value)}
                                    rows={3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-bloomy-400 resize-none mt-2"
                                    placeholder="Topic content..." />
                                )}
                                {/* ASSIGNMENT */}
                                {lesson.type === 'assignment' && (
                                  <div className="space-y-2 pt-2">
                                    <textarea value={lesson.content} onChange={e => updLesson(mi, li, 'content', e.target.value)}
                                      rows={3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-bloomy-400 resize-none"
                                      placeholder="Assignment brief — describe the task, requirements, submission format..." />
                                    <p className="text-xs text-orange-600 flex items-center gap-1.5"><Paperclip className="w-3 h-3" />Students will upload a file to submit</p>
                                  </div>
                                )}
                                {/* QUIZ */}
                                {lesson.type === 'quiz' && (
                                  <div className="mt-2 bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                                        <HelpCircle className="w-3.5 h-3.5" />Quiz Questions
                                      </p>
                                      {lesson.id ? (
                                        <button type="button"
                                          onClick={() => setQuizLesson({ id: lesson.id!, title: lesson.title || 'Quiz' })}
                                          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-1">
                                          <HelpCircle className="w-3 h-3" />Build / Edit Quiz
                                        </button>
                                      ) : (
                                        <button type="button" onClick={() => saveCourse(false)}
                                          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-1.5">
                                          <Save className="w-3 h-3" />Save course first
                                        </button>
                                      )}
                                    </div>
                                    {!lesson.id && (
                                      <p className="text-xs text-purple-500">Enter a title above, save the course, then click "Build / Edit Quiz" to add questions.</p>
                                    )}
                                    {lesson.id && (
                                      <p className="text-xs text-purple-500">Click "Build / Edit Quiz" to add/edit questions, set pass score, time limit and view results.</p>
                                    )}
                                  </div>
                                )}
                                {/* SURVEY */}
                                {lesson.type === 'survey' && (
                                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                                        <MessageSquare className="w-3.5 h-3.5" />Survey / Feedback Form
                                      </p>
                                      <a href="/admin/surveys" target="_blank"
                                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" />Create Survey →
                                      </a>
                                    </div>
                                    <p className="text-xs text-blue-600">Go to <strong>Admin → Surveys & Polls</strong> to create a survey, then paste its link below:</p>
                                    <input value={lesson.content || ''} onChange={e => updLesson(mi, li, 'content', e.target.value)}
                                      className="w-full text-xs border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                                      placeholder="Paste survey URL (Google Forms, Typeform, or Surveys & Polls link)..." />
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

      {/* Quiz Builder Modal */}
      {quizLesson && (
        <QuizBuilder
          lessonId={quizLesson.id}
          lessonTitle={quizLesson.title}
          courseId={selectedCourseId || undefined}
          onClose={() => setQuizLesson(null)}
          onSaved={() => {}}
        />
      )}
    </div>
  )
}
