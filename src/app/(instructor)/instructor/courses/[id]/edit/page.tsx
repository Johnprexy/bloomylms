'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  const [activeTab, setActiveTab] = useState<'info' | 'curriculum'>('info')
  const [course, setCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/courses/categories').then(r => r.json()),
      fetch(`/api/instructor/courses/${courseId}`).then(r => r.json()),
      fetch(`/api/instructor/courses/${courseId}/modules`).then(r => r.json()),
    ]).then(([cats, courseRes, modsRes]) => {
      if (cats.data) setCategories(cats.data)
      if (courseRes.data) setCourse(courseRes.data)
      if (modsRes.data) setModules(modsRes.data)
      setLoading(false)
    })
  }, [courseId])

  async function handleSave(status?: string) {
    setSaving(true)
    await fetch('/api/instructor/courses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: courseId, ...course, ...(status ? { status } : {}) }),
    })
    setSaving(false)
    if (status === 'published') router.push('/instructor/courses')
  }

  const update = (k: string, v: any) => setCourse((c: any) => ({ ...c, [k]: v }))
  const addModule = () => setModules(m => [...m, { id: null, title: `Module ${m.length + 1}`, lessons: [] }])
  const updateModule = (mi: number, k: string, v: string) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, [k]: v } : mod))
  const addLesson = (mi: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: [...(mod.lessons || []), { id: null, title: '', type: 'video', video_url: '' }] } : mod))
  const updateLesson = (mi: number, li: number, k: string, v: string) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: (mod.lessons || []).map((l: any, j: number) => j === li ? { ...l, [k]: v } : l) } : mod))
  const removeLesson = (mi: number, li: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: (mod.lessons || []).filter((_: any, j: number) => j !== li) } : mod))

  const inp = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-bloomy-600 animate-spin" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/instructor/courses" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Course</h1>
            <p className="text-sm text-gray-400 truncate max-w-xs">{course?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/courses/${course?.slug}`} className="btn-secondary text-sm flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />Preview</Link>
          <button onClick={() => handleSave()} disabled={saving} className="btn-secondary text-sm flex items-center gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
          </button>
          {course?.status !== 'published' ? (
            <button onClick={() => handleSave('published')} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Publish</button>
          ) : (
            <button onClick={() => handleSave('draft')} disabled={saving} className="btn-secondary text-sm flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5" />Unpublish</button>
          )}
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-xs">
        {[['info', 'Course Info'], ['curriculum', 'Curriculum']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id as any)} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {activeTab === 'info' && course && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label><input value={course.title || ''} onChange={e => update('title', e.target.value)} className={inp} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label><textarea value={course.short_description || ''} onChange={e => update('short_description', e.target.value)} rows={2} className={inp + ' resize-none'} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label><textarea value={course.description || ''} onChange={e => update('description', e.target.value)} rows={5} className={inp + ' resize-none'} /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label><select value={course.category_id || ''} onChange={e => update('category_id', e.target.value)} className={inp}><option value="">Select...</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label><select value={course.difficulty || 'beginner'} onChange={e => update('difficulty', e.target.value)} className={inp}>{DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (weeks)</label><input type="number" value={course.duration_weeks || 12} onChange={e => update('duration_weeks', parseInt(e.target.value))} className={inp} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Price</label><input type="number" value={course.price || 0} onChange={e => update('price', parseFloat(e.target.value))} className={inp} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label><select value={course.currency || 'NGN'} onChange={e => update('currency', e.target.value)} className={inp}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
        </div>
      )}

      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Modules & Lessons</h2>
            <button onClick={addModule} className="btn-secondary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />Add Module</button>
          </div>
          {modules.map((mod, mi) => (
            <div key={mi} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <input value={mod.title || ''} onChange={e => updateModule(mi, 'title', e.target.value)} className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none" />
                <span className="text-xs text-gray-400">{mod.lessons?.length || 0} lessons</span>
              </div>
              <div className="p-4 space-y-3">
                {(mod.lessons || []).map((lesson: any, li: number) => (
                  <div key={li} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <select value={lesson.type || 'video'} onChange={e => updateLesson(mi, li, 'type', e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white">
                      <option value="video">📹 Video</option><option value="text">📄 Text</option><option value="quiz">❓ Quiz</option><option value="assignment">📎 Assignment</option>
                    </select>
                    <input value={lesson.title || ''} onChange={e => updateLesson(mi, li, 'title', e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400" placeholder="Lesson title" />
                    {lesson.type === 'video' && <input value={lesson.video_url || ''} onChange={e => updateLesson(mi, li, 'video_url', e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" placeholder="Video URL" />}
                    <button onClick={() => removeLesson(mi, li)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => addLesson(mi)} className="w-full py-2 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" />Add Lesson</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
