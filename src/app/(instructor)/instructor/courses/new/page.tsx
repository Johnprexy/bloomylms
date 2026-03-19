'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, GripVertical, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { slugify } from '@/lib/utils'

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced']
const CURRENCIES = ['NGN', 'USD', 'GBP']

export default function NewCoursePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [course, setCourse] = useState({ title: '', slug: '', short_description: '', description: '', category_id: '', price: 0, currency: 'NGN', difficulty: 'beginner', duration_weeks: 12, requirements: [''], what_you_learn: [''], tags: '', certificate_enabled: true })
  const [modules, setModules] = useState([{ title: 'Module 1: Introduction', lessons: [{ title: '', type: 'video', content: '' }] }])

  useEffect(() => {
    fetch('/api/courses/categories').then(r => r.json()).then(d => d.data && setCategories(d.data))
  }, [])

  const updateCourse = (k: string, v: any) => setCourse(f => ({ ...f, [k]: v, ...(k === 'title' ? { slug: slugify(v) } : {}) }))
  const updateList = (field: 'requirements' | 'what_you_learn', idx: number, val: string) => { const arr = [...course[field]]; arr[idx] = val; updateCourse(field, arr) }
  const addListItem = (f: 'requirements' | 'what_you_learn') => updateCourse(f, [...course[f], ''])
  const removeListItem = (f: 'requirements' | 'what_you_learn', idx: number) => updateCourse(f, course[f].filter((_: string, i: number) => i !== idx))
  const addModule = () => setModules(m => [...m, { title: `Module ${m.length + 1}`, lessons: [{ title: '', type: 'video', content: '' }] }])
  const addLesson = (mi: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: [...mod.lessons, { title: '', type: 'video', content: '' }] } : mod))
  const updateModule = (mi: number, k: string, v: string) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, [k]: v } : mod))
  const updateLesson = (mi: number, li: number, k: string, v: string) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: mod.lessons.map((l, j) => j === li ? { ...l, [k]: v } : l) } : mod))
  const removeLesson = (mi: number, li: number) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, lessons: mod.lessons.filter((_, j) => j !== li) } : mod))

  async function saveCourse(publish = false) {
    setSaving(true)
    const tags = course.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    const res = await fetch('/api/instructor/courses', {
      method: courseId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...course, tags, requirements: course.requirements.filter(Boolean), what_you_learn: course.what_you_learn.filter(Boolean), status: publish ? 'published' : 'draft', ...(courseId ? { id: courseId } : {}), modules })
    }).then(r => r.json())
    setSaving(false)
    if (res.data) {
      setCourseId(res.data.id)
      if (publish) router.push('/instructor/courses')
      else setStep(3)
    }
  }

  const inp = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/instructor/courses" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        {['Course Info', 'Curriculum', 'Review'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <button onClick={() => setStep(i + 1)} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === i + 1 ? 'bloomy-gradient text-white' : step > i + 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{step > i + 1 ? '✓' : i + 1}</button>
            <span className={`text-sm font-medium ${step === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <div className={`w-12 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Course Information</h2>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title *</label><input value={course.title} onChange={e => updateCourse('title', e.target.value)} className={inp} placeholder="e.g. Linux, DevOps & Cloud Engineering" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">URL Slug</label><input value={course.slug} onChange={e => updateCourse('slug', e.target.value)} className={inp} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label><textarea value={course.short_description} onChange={e => updateCourse('short_description', e.target.value)} rows={2} className={inp + ' resize-none'} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description *</label><textarea value={course.description} onChange={e => updateCourse('description', e.target.value)} rows={5} className={inp + ' resize-none'} /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label><select value={course.category_id} onChange={e => updateCourse('category_id', e.target.value)} className={inp}><option value="">Select...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label><select value={course.difficulty} onChange={e => updateCourse('difficulty', e.target.value)} className={inp}>{DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (weeks)</label><input type="number" value={course.duration_weeks} onChange={e => updateCourse('duration_weeks', parseInt(e.target.value))} className={inp} min={1} /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Price</label><input type="number" value={course.price} onChange={e => updateCourse('price', parseFloat(e.target.value))} className={inp} min={0} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label><select value={course.currency} onChange={e => updateCourse('currency', e.target.value)} className={inp}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma separated)</label><input value={course.tags} onChange={e => updateCourse('tags', e.target.value)} className={inp} placeholder="AWS, Docker, Kubernetes" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">What students will learn</label>{course.what_you_learn.map((item: string, i: number) => <div key={i} className="flex gap-2 mb-2"><input value={item} onChange={e => updateList('what_you_learn', i, e.target.value)} className={inp} placeholder={`Outcome ${i+1}`} />{course.what_you_learn.length > 1 && <button onClick={() => removeListItem('what_you_learn', i)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>}</div>)}<button onClick={() => addListItem('what_you_learn')} className="text-sm text-bloomy-600 flex items-center gap-1 mt-1"><Plus className="w-3.5 h-3.5" />Add outcome</button></div>
          <div className="flex justify-end"><button onClick={() => setStep(2)} disabled={!course.title} className="btn-primary">Next: Curriculum →</button></div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold text-gray-900">Curriculum</h2><button onClick={addModule} className="btn-secondary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />Add Module</button></div>
          {modules.map((mod, mi) => (
            <div key={mi} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <input value={mod.title} onChange={e => updateModule(mi, 'title', e.target.value)} className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none" />
                <span className="text-xs text-gray-400">{mod.lessons.length} lessons</span>
              </div>
              <div className="p-4 space-y-3">
                {mod.lessons.map((lesson, li) => (
                  <div key={li} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <select value={lesson.type} onChange={e => updateLesson(mi, li, 'type', e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white">
                      <option value="video">📹 Video</option><option value="text">📄 Text</option><option value="quiz">❓ Quiz</option><option value="assignment">📎 Assignment</option>
                    </select>
                    <input value={lesson.title} onChange={e => updateLesson(mi, li, 'title', e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400" placeholder={`Lesson ${li+1} title`} />
                    {lesson.type === 'video' && <input value={lesson.content} onChange={e => updateLesson(mi, li, 'content', e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none" placeholder="Video URL" />}
                    <button onClick={() => removeLesson(mi, li)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button onClick={() => addLesson(mi)} className="w-full py-2 border border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" />Add Lesson</button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2"><button onClick={() => setStep(1)} className="btn-secondary">← Back</button><button onClick={() => saveCourse(false)} disabled={saving} className="btn-primary flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save & Review →</button></div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Review & Publish</h2>
          <div className="bg-gray-50 rounded-xl p-5 space-y-3">
            {[["Title", course.title], ["Price", course.price === 0 ? "Free" : `${course.currency} ${course.price}`], ["Modules", modules.length], ["Total Lessons", modules.reduce((s, m) => s + m.lessons.length, 0)]].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between text-sm"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-900">{v}</span></div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
            <button onClick={() => saveCourse(false)} disabled={saving} className="btn-secondary flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Draft</button>
            <button onClick={() => saveCourse(true)} disabled={saving} className="btn-primary flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '🚀'}Publish Course</button>
          </div>
        </div>
      )}
    </div>
  )
}
