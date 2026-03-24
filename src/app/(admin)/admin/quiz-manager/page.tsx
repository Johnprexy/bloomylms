'use client'
import { useUrlState } from '@/lib/useUrlState'
import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, BarChart2, Eye, Copy, Loader2, HelpCircle,
  CheckCircle, Clock, Archive, Filter, BookOpen } from 'lucide-react'
import QuizBuilderV2 from '@/components/admin/QuizBuilderV2'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-50 text-green-700',
  archived: 'bg-yellow-50 text-yellow-600',
}

export default function QuizManagerPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { getParam, setParam } = useUrlState()
  const [search, setSearch] = useState(() => getParam('q') || '')
  const [filterCourse, setFilterCourse] = useState(() => getParam('course') || '')
  const [filterStatus, setFilterStatus] = useState(() => getParam('status') || '')
  const [editingQuiz, setEditingQuiz] = useState<any>(null)
  const [creating, setCreating] = useState(false)
  const [selectedCourseForNew, setSelectedCourseForNew] = useState('')

  useEffect(() => { load(true) }, [])
  useEffect(() => { load() }, [filterCourse, filterStatus])

  async function load(restoreEdit = false) {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCourse) params.set('course_id', filterCourse)
    if (filterStatus) params.set('status', filterStatus)
    if (search) params.set('search', search)
    const [qRes, cRes] = await Promise.all([
      fetch('/api/v2/quizzes?' + params).then(r => r.json()),
      fetch('/api/admin/course-builder').then(r => r.json()),
    ])
    const quizList = qRes.data || []
    setQuizzes(quizList)
    setCourses(cRes.data || [])
    setLoading(false)
    // Restore editing state from URL
    const editId = getParam('edit')
    if (editId && restoreEdit) {
      const found = quizList.find((q: any) => q.id === editId)
      if (found) setEditingQuiz(found)
    }
  }

  async function deleteQuiz(id: string, title: string) {
    if (!confirm(`Delete quiz "${title}"? This will remove all attempts and questions.`)) return
    await fetch(`/api/v2/quizzes/${id}`, { method: 'DELETE' })
    setQuizzes(prev => prev.filter(q => q.id !== id))
  }

  async function togglePublish(quiz: any) {
    const newStatus = quiz.status === 'published' ? 'draft' : 'published'
    await fetch(`/api/v2/quizzes/${quiz.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, status: newStatus } : q))
  }

  async function duplicateQuiz(quiz: any) {
    const res = await fetch(`/api/v2/quizzes/${quiz.id}`).then(r => r.json())
    if (!res.data) return
    const newQ = await fetch('/api/v2/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...res.data, title: res.data.title + ' (Copy)', status: 'draft', course_id: res.data.course_id }) }).then(r => r.json())
    if (newQ.data?.id && res.data.questions?.length) {
      await fetch(`/api/v2/quizzes/${newQ.data.id}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questions: res.data.questions }) })
    }
    load()
  }

  const filtered = quizzes.filter(q => !search || q.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900">Quiz Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage all quizzes across your courses</p></div>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />New Quiz
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="Search quizzes..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500" />
        </div>
        <select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setParam('course', e.target.value) }} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white">
          <option value="">All Courses</option>
          {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setParam('status', e.target.value) }} className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button onClick={() => load()} className="btn-secondary text-sm px-4 py-2.5">Search</button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Quizzes', value: quizzes.length, color: 'text-bloomy-600' },
          { label: 'Published', value: quizzes.filter(q => q.status === 'published').length, color: 'text-green-600' },
          { label: 'Total Attempts', value: quizzes.reduce((s: number, q: any) => s + parseInt(q.attempt_count || 0), 0), color: 'text-blue-600' },
          { label: 'Avg Pass Rate', value: (() => { const p = quizzes.filter(q => q.attempt_count > 0); return p.length ? Math.round(p.reduce((s: number, q: any) => s + (parseInt(q.pass_count || 0) / parseInt(q.attempt_count || 1) * 100), 0) / p.length) + '%' : '—' })(), color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quiz list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-600">No quizzes yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first quiz to get started</p>
          <button onClick={() => setCreating(true)} className="btn-primary text-sm mt-4">+ Create Quiz</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full min-w-[700px]">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              {['Quiz', 'Course', 'Status', 'Questions', 'Attempts', 'Avg Score', 'Pass Rate', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(q => {
                const passRate = q.attempt_count > 0 ? Math.round((q.pass_count / q.attempt_count) * 100) : null
                return (
                  <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-sm text-gray-900">{q.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Pass: {q.passing_score}% · {q.max_attempts} attempt{q.max_attempts !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600 max-w-32 truncate">{q.course_title || '—'}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => togglePublish(q)} className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:opacity-80 ${STATUS_COLORS[q.status] || STATUS_COLORS.draft}`}>
                        {q.status}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{q.question_count || 0}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{q.attempt_count || 0}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{q.avg_score ? q.avg_score + '%' : '—'}</td>
                    <td className="px-4 py-3.5">
                      {passRate !== null ? (
                        <span className={`text-sm font-bold ${passRate >= 70 ? 'text-green-600' : passRate >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>{passRate}%</span>
                      ) : <span className="text-gray-400 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingQuiz(q); setParam('edit', q.id) }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bloomy-50 text-bloomy-600" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => duplicateQuiz(q)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteQuiz(q.id, q.title)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create new quiz modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Create New Quiz</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Course (optional)</label>
                <select value={selectedCourseForNew} onChange={e => setSelectedCourseForNew(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white">
                  <option value="">General / Not linked to a course</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCreating(false)} className="btn-secondary text-sm flex-1">Cancel</button>
              <button onClick={() => { setCreating(false); setEditingQuiz({ _new: true, course_id: selectedCourseForNew }) }} className="btn-primary text-sm flex-1">Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz builder modal */}
      {editingQuiz && (
        <QuizBuilderV2
          quizId={editingQuiz._new ? undefined : editingQuiz.id}
          courseId={editingQuiz.course_id || editingQuiz._new ? selectedCourseForNew : undefined}
          onClose={() => { setEditingQuiz(null); setParam('edit', null); load() }}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}
