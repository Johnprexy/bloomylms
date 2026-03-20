'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, Globe, EyeOff,
  Video, FileText, HelpCircle, Paperclip, ChevronDown, ChevronRight,
  Loader2, Settings, BookOpen, Users, Eye
} from 'lucide-react'

interface Props {
  course: any
  modules: any[]
  instructors: any[]
  categories: any[]
  role: string
}

const LESSON_TYPES = [
  { value: 'video', label: 'Video', icon: Video },
  { value: 'text', label: 'Text / Article', icon: FileText },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle },
  { value: 'assignment', label: 'Assignment', icon: Paperclip },
]

export default function AdminCourseBuilder({ course, modules: initialModules, instructors, categories, role }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'curriculum' | 'settings' | 'students'>('curriculum')
  const [modules, setModules] = useState<any[]>(initialModules.map(m => ({ ...m, lessons: m.lessons || [], open: true })))
  const [courseData, setCourseData] = useState(course)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollEmail, setEnrollEmail] = useState('')
  const [enrollMsg, setEnrollMsg] = useState('')

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white'

  // — Module helpers —
  const addModule = () => setModules(m => [...m, { id: null, title: `Module ${m.length + 1}`, position: m.length, is_published: true, open: true, lessons: [] }])
  const updateModule = (mi: number, k: string, v: any) => setModules(m => m.map((mod, i) => i === mi ? { ...mod, [k]: v } : mod))
  const removeModule = (mi: number) => setModules(m => m.filter((_, i) => i !== mi))

  // — Lesson helpers —
  const addLesson = (mi: number) => setModules(m => m.map((mod, i) => i === mi
    ? { ...mod, lessons: [...mod.lessons, { id: null, title: '', type: 'video', video_url: '', content: '', video_duration: null, is_published: true, is_preview: false, position: mod.lessons.length }] }
    : mod))
  const updateLesson = (mi: number, li: number, k: string, v: any) => setModules(m => m.map((mod, i) => i === mi
    ? { ...mod, lessons: mod.lessons.map((l: any, j: number) => j === li ? { ...l, [k]: v } : l) }
    : mod))
  const removeLesson = (mi: number, li: number) => setModules(m => m.map((mod, i) => i === mi
    ? { ...mod, lessons: mod.lessons.filter((_: any, j: number) => j !== li) }
    : mod))

  async function saveCurriculum() {
    setSaving(true)
    const res = await fetch(`/api/admin/courses/${course.id}/curriculum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modules }),
    }).then(r => r.json())
    setSaving(false)
    if (res.success) {
      setSavedMsg('Saved ✓')
      setTimeout(() => setSavedMsg(''), 2500)
      router.refresh()
    }
  }

  async function saveCourseSettings() {
    setSaving(true)
    await fetch(`/api/admin/courses/${course.id}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData),
    })
    setSaving(false)
    setSavedMsg('Saved ✓')
    setTimeout(() => setSavedMsg(''), 2500)
  }

  async function togglePublish() {
    const newStatus = courseData.status === 'published' ? 'draft' : 'published'
    await fetch('/api/admin/courses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: course.id, status: newStatus }) })
    setCourseData((d: any) => ({ ...d, status: newStatus }))
  }

  async function enrollStudent(e: React.FormEvent) {
    e.preventDefault()
    setEnrolling(true)
    setEnrollMsg('')
    const res = await fetch('/api/admin/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: enrollEmail, course_id: course.id }),
    }).then(r => r.json())
    setEnrolling(false)
    setEnrollMsg(res.error || '✓ Student enrolled successfully')
    if (!res.error) setEnrollEmail('')
  }

  const lessonIcon = (type: string) => {
    const t = LESSON_TYPES.find(x => x.value === type)
    return t ? t.icon : Video
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-sm">{courseData.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${courseData.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                {courseData.status}
              </span>
              <span className="text-xs text-gray-400">{courseData.instructor_name}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-sm text-green-600 font-medium">{savedMsg}</span>}
          <Link href={`/courses/${courseData.slug}`} target="_blank" className="btn-secondary text-xs flex items-center gap-1.5 py-2">
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>
          <button onClick={togglePublish} className={`text-xs font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${courseData.status === 'published' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
            {courseData.status === 'published' ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Globe className="w-3.5 h-3.5" /> Publish</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-sm">
        {[['curriculum', 'Curriculum', BookOpen], ['settings', 'Settings', Settings], ['students', 'Students', Users]].map(([id, label, Icon]: any) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── CURRICULUM TAB ── */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{modules.length} modules · {modules.reduce((s, m) => s + (m.lessons?.length || 0), 0)} lessons</p>
            <div className="flex items-center gap-2">
              <button onClick={addModule} className="btn-secondary text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Module
              </button>
              <button onClick={saveCurriculum} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>

          {modules.map((mod, mi) => (
            <div key={mi} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Module header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <button onClick={() => updateModule(mi, 'open', !mod.open)} className="text-gray-400 hover:text-gray-600">
                  {mod.open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <input
                  value={mod.title}
                  onChange={e => updateModule(mi, 'title', e.target.value)}
                  className="flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:px-2 focus:rounded transition-all"
                  placeholder="Module title"
                />
                <span className="text-xs text-gray-400 flex-shrink-0">{mod.lessons?.length || 0} lessons</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
                  <input type="checkbox" checked={mod.is_published} onChange={e => updateModule(mi, 'is_published', e.target.checked)} className="w-3.5 h-3.5" />
                  Published
                </label>
                <button onClick={() => removeModule(mi)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Lessons */}
              {mod.open && (
                <div className="p-3 space-y-2">
                  {mod.lessons?.map((lesson: any, li: number) => {
                    const LIcon = lessonIcon(lesson.type)
                    const isExpanded = expandedLesson === `${mi}-${li}`
                    return (
                      <div key={li} className="border border-gray-100 rounded-lg overflow-hidden">
                        {/* Lesson row */}
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-white">
                          <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-50 flex-shrink-0">
                            <LIcon className="w-3.5 h-3.5 text-gray-500" />
                          </div>
                          <input
                            value={lesson.title}
                            onChange={e => updateLesson(mi, li, 'title', e.target.value)}
                            className="flex-1 text-sm text-gray-800 outline-none border-b border-transparent focus:border-bloomy-400 transition-colors"
                            placeholder="Lesson title"
                          />
                          <select
                            value={lesson.type}
                            onChange={e => updateLesson(mi, li, 'type', e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white flex-shrink-0">
                            {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <label className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                            <input type="checkbox" checked={lesson.is_preview} onChange={e => updateLesson(mi, li, 'is_preview', e.target.checked)} className="w-3 h-3" />
                            Preview
                          </label>
                          <button onClick={() => setExpandedLesson(isExpanded ? null : `${mi}-${li}`)} className="text-gray-400 hover:text-bloomy-600 flex-shrink-0">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <button onClick={() => removeLesson(mi, li)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Expanded lesson details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100 space-y-3">
                            {lesson.type === 'video' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Video URL (YouTube embed, Vimeo, or direct MP4)</label>
                                <input
                                  value={lesson.video_url || ''}
                                  onChange={e => updateLesson(mi, li, 'video_url', e.target.value)}
                                  className={inp}
                                  placeholder="https://www.youtube.com/embed/xxxx or https://vimeo.com/..."
                                />
                                <p className="text-xs text-gray-400 mt-1">For YouTube: use the embed URL (youtube.com/embed/VIDEO_ID)</p>
                              </div>
                            )}
                            {lesson.type === 'video' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Duration (seconds)</label>
                                <input
                                  type="number"
                                  value={lesson.video_duration || ''}
                                  onChange={e => updateLesson(mi, li, 'video_duration', parseInt(e.target.value) || null)}
                                  className={`${inp} w-40`}
                                  placeholder="e.g. 3600 = 1hr"
                                />
                              </div>
                            )}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                {lesson.type === 'video' ? 'Lesson notes / description' : 'Content / Instructions'}
                              </label>
                              <textarea
                                value={lesson.content || ''}
                                onChange={e => updateLesson(mi, li, 'content', e.target.value)}
                                rows={4}
                                className={`${inp} resize-none`}
                                placeholder={lesson.type === 'video' ? 'Notes, links, or resources for this lesson...' : 'Full lesson content here...'}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <button onClick={() => addLesson(mi)}
                    className="w-full py-2 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 transition-colors flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Lesson
                  </button>
                </div>
              )}
            </div>
          ))}

          {modules.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">No modules yet</p>
              <button onClick={addModule} className="btn-primary text-sm flex items-center gap-1.5 mx-auto">
                <Plus className="w-4 h-4" /> Add First Module
              </button>
            </div>
          )}

          <div className="flex justify-end">
            <button onClick={saveCurriculum} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Curriculum'}
            </button>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course Title</label>
              <input value={courseData.title || ''} onChange={e => setCourseData((d: any) => ({ ...d, title: e.target.value }))} className={inp} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
              <textarea value={courseData.short_description || ''} onChange={e => setCourseData((d: any) => ({ ...d, short_description: e.target.value }))} rows={2} className={`${inp} resize-none`} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label>
              <textarea value={courseData.description || ''} onChange={e => setCourseData((d: any) => ({ ...d, description: e.target.value }))} rows={5} className={`${inp} resize-none`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructor</label>
              <select value={courseData.instructor_id || ''} onChange={e => setCourseData((d: any) => ({ ...d, instructor_id: e.target.value }))} className={inp}>
                {instructors.map((i: any) => <option key={i.id} value={i.id}>{i.full_name} ({i.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select value={courseData.category_id || ''} onChange={e => setCourseData((d: any) => ({ ...d, category_id: e.target.value }))} className={inp}>
                <option value="">Select category</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (NGN)</label>
              <input type="number" value={courseData.price || 0} onChange={e => setCourseData((d: any) => ({ ...d, price: parseFloat(e.target.value) }))} className={inp} min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Difficulty</label>
              <select value={courseData.difficulty || 'beginner'} onChange={e => setCourseData((d: any) => ({ ...d, difficulty: e.target.value }))} className={inp}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (weeks)</label>
              <input type="number" value={courseData.duration_weeks || 12} onChange={e => setCourseData((d: any) => ({ ...d, duration_weeks: parseInt(e.target.value) }))} className={inp} min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail URL</label>
              <input value={courseData.thumbnail_url || ''} onChange={e => setCourseData((d: any) => ({ ...d, thumbnail_url: e.target.value }))} className={inp} placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={saveCourseSettings} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === 'students' && (
        <div className="space-y-5">
          {/* Enroll form */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-bloomy-600" /> Enroll a Student
            </h3>
            <form onSubmit={enrollStudent} className="flex gap-3">
              <input
                type="email"
                value={enrollEmail}
                onChange={e => setEnrollEmail(e.target.value)}
                placeholder="student@email.com"
                required
                className={`${inp} flex-1`}
              />
              <button type="submit" disabled={enrolling} className="btn-primary flex items-center gap-2 flex-shrink-0">
                {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Enroll
              </button>
            </form>
            {enrollMsg && (
              <p className={`text-sm mt-2 font-medium ${enrollMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {enrollMsg}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              The student must already have an account. If they don't, create their account first in User Management.
            </p>
          </div>

          {/* Enrolled students list */}
          <EnrolledStudentsList courseId={course.id} />
        </div>
      )}
    </div>
  )
}

function EnrolledStudentsList({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = () => {
    if (loaded) return
    fetch(`/api/admin/courses/${courseId}/students`).then(r => r.json()).then(d => {
      setStudents(d.data || [])
      setLoaded(true)
    })
  }

  if (!loaded) return (
    <div className="text-center py-6">
      <button onClick={load} className="btn-secondary text-sm">Load enrolled students</button>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Enrolled Students ({students.length})</h3>
      </div>
      {students.length > 0 ? (
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Student', 'Enrolled', 'Progress', 'Status'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {students.map((s: any) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{s.full_name}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(s.enrolled_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                      <div className="h-1.5 bg-bloomy-500 rounded-full" style={{ width: `${s.progress_percent}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(s.progress_percent)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-10 text-gray-400 text-sm">No students enrolled yet</div>
      )}
    </div>
  )
}
