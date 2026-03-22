'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, ClipboardList, BarChart2, CheckCircle, Edit, Copy, Link2, X, AlertCircle } from 'lucide-react'

const SURVEY_TYPES = [
  { value: 'pre_course',  label: 'Pre-course Survey',  color: 'bg-blue-50 text-blue-700' },
  { value: 'post_course', label: 'Post-course Survey',  color: 'bg-green-50 text-green-700' },
  { value: 'feedback',    label: 'Feedback Form',       color: 'bg-purple-50 text-purple-700' },
  { value: 'poll',        label: 'Poll',                color: 'bg-orange-50 text-orange-700' },
  { value: 'general',     label: 'General',             color: 'bg-gray-100 text-gray-700' },
]

const Q_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'short_text',      label: 'Short Text' },
  { value: 'long_text',       label: 'Long Text' },
  { value: 'rating',          label: 'Rating (1–5)' },
  { value: 'yes_no',          label: 'Yes / No' },
]

const emptyForm = () => ({
  id: null as string | null,
  title: '', description: '', type: 'feedback',
  course_id: '', cohort_id: '', is_anonymous: true,
  questions: [{ question: '', type: 'multiple_choice', options: ['', ''], required: true }]
})

export default function SurveysPage() {
  const [surveys, setSurveys]   = useState<any[]>([])
  const [courses, setCourses]   = useState<any[]>([])
  const [cohorts, setCohorts]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [view, setView]         = useState<'list' | 'edit' | 'results'>('list')
  const [selected, setSelected] = useState<any>(null)
  const [results, setResults]   = useState<any>(null)
  const [form, setForm]         = useState(emptyForm())
  const [saving, setSaving]     = useState(false)
  const [copied, setCopied]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/surveys').then(r => r.json()).then(d => {
      setSurveys(d.surveys || [])
      setCourses(d.courses || [])
      setLoading(false)
    })
    fetch('/api/admin/cohorts-full').then(r => r.json()).then(d => {
      setCohorts(d.cohorts || [])
    }).catch(() => {})
  }, [])

  async function loadEdit(survey: any) {
    const d = await fetch(`/api/admin/surveys?id=${survey.id}`).then(r => r.json())
    setForm({
      id: survey.id,
      title: survey.title || '',
      description: survey.description || '',
      type: survey.type || 'feedback',
      course_id: survey.course_id || '',
      cohort_id: survey.cohort_id || '',
      is_anonymous: survey.is_anonymous ?? true,
      questions: d.questions?.length ? d.questions.map((q: any) => ({
        question: q.question,
        type: q.type,
        options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : ['', '']),
        required: q.required ?? true,
      })) : [{ question: '', type: 'multiple_choice', options: ['', ''], required: true }]
    })
    setView('edit')
  }

  async function viewResults(survey: any) {
    setSelected(survey)
    const d = await fetch(`/api/admin/surveys?id=${survey.id}`).then(r => r.json())
    setResults(d)
    setView('results')
  }

  async function saveSurvey() {
    if (!form.title.trim()) { alert('Enter a survey title'); return }
    setSaving(true)
    const method = form.id ? 'PUT' : 'POST'
    const res = await fetch('/api/admin/surveys', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json())
    setSaving(false)
    if (res.data) {
      const d = await fetch('/api/admin/surveys').then(r => r.json())
      setSurveys(d.surveys || [])
      setView('list')
      setForm(emptyForm())
    }
  }

  async function deleteSurvey(id: string) {
    if (!confirm('Delete this survey?')) return
    await fetch(`/api/admin/surveys?id=${id}`, { method: 'DELETE' })
    setSurveys(prev => prev.filter(s => s.id !== id))
  }

  async function toggleActive(id: string, is_active: boolean) {
    await fetch('/api/admin/surveys', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    setSurveys(s => s.map(x => x.id === id ? { ...x, is_active: !is_active } : x))
  }

  function copySurveyLink(surveyId: string) {
    const url = `${window.location.origin}/survey/${surveyId}`
    navigator.clipboard.writeText(url)
    setCopied(surveyId)
    setTimeout(() => setCopied(null), 2500)
  }

  function addQ() {
    setForm(f => ({ ...f, questions: [...f.questions, { question: '', type: 'multiple_choice', options: ['', ''], required: true }] }))
  }

  function updQ(i: number, k: string, v: any) {
    setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === i ? { ...q, [k]: v } : q) }))
  }

  function addOpt(qi: number) {
    setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === qi ? { ...q, options: [...(q.options || []), ''] } : q) }))
  }

  function updOpt(qi: number, oi: number, v: string) {
    setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === qi ? { ...q, options: q.options.map((o: string, k: number) => k === oi ? v : o) } : q) }))
  }

  function removeQ(i: number) {
    setForm(f => ({ ...f, questions: f.questions.filter((_, j) => j !== i) }))
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  // ── RESULTS VIEW ──
  if (view === 'results' && selected && results) {
    const cohortName = cohorts.find((c: any) => c.id === selected.cohort_id)?.name
    const courseName = courses.find((c: any) => c.id === selected.course_id)?.title
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setView('list')} className="text-sm text-bloomy-600 hover:underline">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">{selected.title}</h1>
          <span className="text-sm text-gray-400">{results.total_responses} responses</span>
        </div>

        {/* Tracking info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Cohort</p>
            <p className="font-medium text-gray-900">{cohortName || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Course</p>
            <p className="font-medium text-gray-900">{courseName || 'All courses'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Type</p>
            <p className="font-medium text-gray-900 capitalize">{selected.type?.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Per-question results */}
        {results.questions?.map((q: any, i: number) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-semibold text-gray-900 mb-4 text-sm">{i + 1}. {q.question}
              <span className="ml-2 text-xs font-normal text-gray-400 capitalize">({q.type?.replace('_', ' ')})</span>
            </p>
            {(q.type === 'multiple_choice' || q.type === 'yes_no') ? (
              <div className="space-y-2">
                {(Array.isArray(q.options) ? q.options : []).map((opt: string) => {
                  const count = results.answers?.filter((a: any) => a.question_id === q.id && a.answer === opt).length || 0
                  const pct = results.total_responses > 0 ? Math.round((count / results.total_responses) * 100) : 0
                  return (
                    <div key={opt} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-32 flex-shrink-0 truncate">{opt}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="h-6 bg-bloomy-500 rounded-lg flex items-center px-2 transition-all" style={{ width: `${Math.max(pct, 3)}%` }}>
                          {pct > 15 && <span className="text-xs text-white font-medium">{pct}%</span>}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            ) : q.type === 'rating' ? (
              <div className="flex items-end gap-4">
                {[1,2,3,4,5].map(n => {
                  const count = results.answers?.filter((a: any) => a.question_id === q.id && String(a.answer) === String(n)).length || 0
                  return (
                    <div key={n} className="flex flex-col items-center gap-1">
                      <span className="text-2xl font-bold text-bloomy-600">{count}</span>
                      <span className="text-yellow-400 text-sm">{'★'.repeat(n)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.answers?.filter((a: any) => a.question_id === q.id).map((a: any, j: number) => (
                  <p key={j} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">{a.answer}</p>
                ))}
                {!results.answers?.filter((a: any) => a.question_id === q.id).length && (
                  <p className="text-sm text-gray-400 italic">No responses yet</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // ── CREATE / EDIT VIEW ──
  if (view === 'edit') {
    return (
      <div className="max-w-3xl mx-auto space-y-5 pb-10">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => { setView('list'); setForm(emptyForm()) }} className="text-sm text-bloomy-600 hover:underline">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">{form.id ? 'Edit Survey' : 'Create Survey'}</h1>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Survey Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} placeholder="e.g. Post-Course Feedback — DevOps Bootcamp" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                {SURVEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course (optional)</label>
              <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))} className={inp}>
                <option value="">All courses / General</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cohort (optional)</label>
              <select value={form.cohort_id} onChange={e => setForm(f => ({ ...f, cohort_id: e.target.value }))} className={inp}>
                <option value="">All cohorts</option>
                {cohorts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inp + ' resize-none'} placeholder="Brief intro shown to students..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="anon" checked={form.is_anonymous} onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))} className="accent-bloomy-600 w-4 h-4" />
              <label htmlFor="anon" className="text-sm text-gray-700 cursor-pointer">Anonymous responses</label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Questions ({form.questions.length})</h2>
            <button onClick={addQ} className="btn-secondary text-sm flex items-center gap-1.5 py-2"><Plus className="w-3.5 h-3.5" />Add Question</button>
          </div>
          {form.questions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-bloomy-100 text-bloomy-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <input value={q.question} onChange={e => updQ(i, 'question', e.target.value)} className={inp + ' flex-1'} placeholder="Question text..." />
                <select value={q.type} onChange={e => updQ(i, 'type', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none flex-shrink-0 bg-white">
                  {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {form.questions.length > 1 && <button onClick={() => removeQ(i)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
              </div>
              {q.type === 'multiple_choice' && (
                <div className="pl-8 space-y-2">
                  {q.options?.map((opt: string, oi: number) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                      <input value={opt} onChange={e => updOpt(i, oi, e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400" placeholder={`Option ${oi + 1}`} />
                    </div>
                  ))}
                  <button onClick={() => addOpt(i)} className="text-xs text-bloomy-600 flex items-center gap-1 pl-6"><Plus className="w-3 h-3" />Add option</button>
                </div>
              )}
              <div className="flex items-center gap-2 pl-8">
                <input type="checkbox" checked={q.required} onChange={e => updQ(i, 'required', e.target.checked)} className="accent-bloomy-600 w-3.5 h-3.5" />
                <span className="text-xs text-gray-500">Required</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pb-6">
          <button onClick={saveSurvey} disabled={saving || !form.title} className="btn-primary flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {form.id ? 'Update Survey' : 'Save Survey'}
          </button>
          <button onClick={() => { setView('list'); setForm(emptyForm()) }} className="btn-secondary text-sm">Cancel</button>
        </div>
      </div>
    )
  }

  // ── LIST VIEW ──
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveys & Polls</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create feedback forms and pre/post-course surveys</p>
        </div>
        <button onClick={() => { setForm(emptyForm()); setView('edit') }} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />New Survey
        </button>
      </div>

      {copied && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-xl">
          <CheckCircle className="w-4 h-4" />Survey link copied to clipboard!
        </div>
      )}

      {surveys.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No surveys yet — create your first one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(s => {
            const typeInfo = SURVEY_TYPES.find(t => t.value === s.type) || SURVEY_TYPES[4]
            const cohortName = cohorts.find((c: any) => c.id === s.cohort_id)?.name
            const courseName = courses.find((c: any) => c.id === s.course_id)?.title
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 bg-bloomy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-bloomy-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900">{s.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      {s.is_anonymous && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Anonymous</span>}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {/* Tracking info */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                      <span>{s.question_count || 0} questions · {s.response_count || 0} responses</span>
                      {cohortName && <span className="flex items-center gap-1">📚 {cohortName}</span>}
                      {courseName && <span className="flex items-center gap-1">🎓 {courseName}</span>}
                    </div>
                    {/* Survey link */}
                    <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 w-fit">
                      <Link2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-mono text-gray-500 truncate max-w-xs">
                        {typeof window !== 'undefined' ? window.location.origin : 'https://bloomylms.vercel.app'}/survey/{s.id}
                      </span>
                      <button onClick={() => copySurveyLink(s.id)}
                        className="text-bloomy-600 hover:text-bloomy-700 flex-shrink-0">
                        {copied === s.id ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleActive(s.id, s.is_active)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100">
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => loadEdit(s)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bloomy-50 text-bloomy-600" title="Edit">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => viewResults(s)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-50 text-purple-600" title="Results">
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSurvey(s.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
