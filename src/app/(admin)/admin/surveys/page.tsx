'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, ClipboardList, BarChart2, CheckCircle, ChevronDown, ChevronUp, Edit, Copy, Link2, X, AlertTriangle, Users } from 'lucide-react'

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

const emptyQ = () => ({ question: '', type: 'multiple_choice', options: ['', ''], required: true })

export default function SurveysPage() {
  const [surveys, setSurveys]   = useState<any[]>([])
  const [courses, setCourses]   = useState<any[]>([])
  const [cohorts, setCohorts]   = useState<any[]>([])
  const [modules, setModules]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [view, setView]         = useState<'list' | 'edit' | 'results'>('list')
  const [selected, setSelected] = useState<any>(null)
  const [results, setResults]   = useState<any>(null)
  const [copied, setCopied]     = useState<string | null>(null)
  const [editId, setEditId]     = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', type: 'feedback',
    course_id: '', cohort_id: '', module_id: '', is_anonymous: true,
    questions: [emptyQ()],
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/surveys').then(r => r.json()),
      fetch('/api/admin/cohorts-full').then(r => r.json()),
    ]).then(([sd, cd]) => {
      setSurveys(sd.surveys || [])
      setCourses(sd.courses || [])
      setModules(sd.modules || [])
      setCohorts(cd.cohorts || [])
      setLoading(false)
    })
  }, [])

  // Modules filtered by selected course
  const filteredModules = form.course_id
    ? modules.filter((m: any) => m.course_id === form.course_id)
    : modules

  function newSurvey() {
    setEditId(null)
    setForm({ title: '', description: '', type: 'feedback', course_id: '', cohort_id: '', module_id: '', is_anonymous: true, questions: [emptyQ()] })
    setView('edit')
  }

  async function loadEdit(survey: any) {
    const d = await fetch(`/api/admin/surveys?id=${survey.id}`).then(r => r.json())
    setEditId(survey.id)
    setForm({
      title: survey.title || '',
      description: survey.description?.replace(/^__cohort:[^_]+__/, '') || '',
      type: survey.type || 'feedback',
      course_id: survey.course_id || d.survey?.course_id || '',
      cohort_id: survey.cohort_id || d.survey?.cohort_id || '',
      module_id: survey.module_id || d.survey?.module_id || '',
      is_anonymous: survey.is_anonymous ?? true,
      questions: d.questions?.length ? d.questions.map((q: any) => ({
        question: q.question,
        type: q.type,
        options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : ['', '']),
        required: q.required ?? true,
      })) : [emptyQ()],
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
    const validQs = form.questions.filter(q => q.question.trim())
    if (!validQs.length) { alert('Add at least one question'); return }
    setSaving(true)
    const res = await fetch('/api/admin/surveys', {
      method: editId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(editId ? { id: editId } : {}), ...form, questions: validQs }),
    }).then(r => r.json())
    setSaving(false)
    if (res.error) { alert('Save failed: ' + res.error); return }
    const sd = await fetch('/api/admin/surveys').then(r => r.json())
    setSurveys(sd.surveys || [])
    setView('list')
  }

  async function deleteSurvey(id: string) {
    if (!confirm('Delete this survey and all responses?')) return
    await fetch(`/api/admin/surveys?id=${id}`, { method: 'DELETE' })
    setSurveys(s => s.filter(x => x.id !== id))
  }

  async function toggleActive(id: string, is_active: boolean) {
    await fetch('/api/admin/surveys', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !is_active }) })
    setSurveys(s => s.map(x => x.id === id ? { ...x, is_active: !is_active } : x))
  }

  function copySurveyLink(surveyId: string) {
    const url = `${window.location.origin}/survey/${surveyId}`
    navigator.clipboard.writeText(url)
    setCopied(surveyId)
    setTimeout(() => setCopied(null), 2500)
  }

  function addQ() { setForm(f => ({ ...f, questions: [...f.questions, emptyQ()] })) }
  function updQ(i: number, k: string, v: any) { setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === i ? { ...q, [k]: v } : q) })) }
  function addOpt(i: number) { setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === i ? { ...q, options: [...(q.options||[]), ''] } : q) })) }
  function updOpt(qi: number, oi: number, v: string) { setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === qi ? { ...q, options: q.options.map((o: string, k: number) => k === oi ? v : o) } : q) })) }
  function removeQ(i: number) { setForm(f => ({ ...f, questions: f.questions.filter((_, j) => j !== i) })) }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  // ── RESULTS VIEW ──
  if (view === 'results' && selected && results) {
    const survey = results.survey || selected
    const cohortName = cohorts.find((c: any) => c.id === (survey.cohort_id || selected.cohort_id))?.name
    const courseName = survey.course_title || courses.find((c: any) => c.id === survey.course_id)?.title
    const moduleName = survey.module_title

    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setView('list')} className="text-sm text-bloomy-600 hover:underline flex items-center gap-1">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">{selected.title}</h1>
          <span className="text-sm text-gray-400">{results.total_responses} response{results.total_responses !== 1 ? 's' : ''}</span>
        </div>

        {/* Tracking info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 grid sm:grid-cols-4 gap-4">
          {[
            { label: 'Cohort',  value: cohortName || '—', icon: '👥' },
            { label: 'Course',  value: courseName || 'All courses', icon: '📚' },
            { label: 'Module',  value: moduleName || '—', icon: '📖' },
            { label: 'Type',    value: (selected.type || '').replace('_', ' '), icon: '📋' },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">{item.label}</p>
              <p className="font-medium text-gray-900 text-sm capitalize">{item.icon} {item.value}</p>
            </div>
          ))}
        </div>

        {/* Per-question results */}
        {results.questions?.map((q: any, i: number) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-semibold text-gray-900 mb-4 text-sm">
              {i + 1}. {q.question}
              <span className="ml-2 text-xs font-normal text-gray-400 capitalize">({q.type?.replace('_', ' ')})</span>
            </p>

            {(q.type === 'multiple_choice' || q.type === 'yes_no') && (
              <div className="space-y-2">
                {(Array.isArray(q.options) ? q.options : []).map((opt: string) => {
                  const count = results.answers?.filter((a: any) => a.question_id === q.id && a.answer === opt).length || 0
                  const pct = results.total_responses > 0 ? Math.round((count / results.total_responses) * 100) : 0
                  return (
                    <div key={opt} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-28 flex-shrink-0 truncate" title={opt}>{opt}</span>
                      <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="h-7 bg-bloomy-500 rounded-lg flex items-center px-3" style={{ width: `${Math.max(pct, 3)}%` }}>
                          {pct > 12 && <span className="text-xs text-white font-semibold">{pct}%</span>}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 w-20 text-right flex-shrink-0">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            )}

            {q.type === 'rating' && (
              <div className="flex items-end gap-6">
                {[1,2,3,4,5].map(n => {
                  const count = results.answers?.filter((a: any) => a.question_id === q.id && String(a.answer) === String(n)).length || 0
                  const pct = results.total_responses > 0 ? Math.round((count / results.total_responses) * 100) : 0
                  return (
                    <div key={n} className="flex flex-col items-center gap-1">
                      <span className="text-2xl font-bold text-bloomy-600">{count}</span>
                      <span className="text-yellow-400 text-sm">{'★'.repeat(n)}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            )}

            {(q.type === 'short_text' || q.type === 'long_text') && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.answers?.filter((a: any) => a.question_id === q.id && a.answer).map((a: any, j: number) => (
                  <div key={j} className="bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-sm text-gray-700">{a.answer}</p>
                    {!selected.is_anonymous && a.student_name && (
                      <p className="text-xs text-gray-400 mt-1">— {a.student_name}</p>
                    )}
                  </div>
                ))}
                {!results.answers?.filter((a: any) => a.question_id === q.id).length && (
                  <p className="text-sm text-gray-400 italic">No responses yet</p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Individual responses table (non-anonymous only) */}
        {!selected.is_anonymous && results.responses?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="font-bold text-gray-900 text-sm flex items-center gap-2"><Users className="w-4 h-4 text-bloomy-500" />Individual Responses</p>
            </div>
            <div className="divide-y divide-gray-50">
              {results.responses.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {r.student_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.student_name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{r.student_email} · {new Date(r.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── EDIT / CREATE VIEW ──
  if (view === 'edit') {
    return (
      <div className="max-w-3xl mx-auto space-y-5 pb-10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="text-sm text-bloomy-600 hover:underline">← Back</button>
            <h1 className="text-xl font-bold text-gray-900">{editId ? 'Edit Survey' : 'Create Survey'}</h1>
          </div>
          <button onClick={saveSurvey} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {editId ? 'Update Survey' : 'Save Survey'}
          </button>
        </div>

        {/* Survey settings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Survey Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} placeholder="e.g. Post-Course Feedback — DevOps Bootcamp" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                {SURVEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cohort</label>
              <select value={form.cohort_id} onChange={e => setForm(f => ({ ...f, cohort_id: e.target.value }))} className={inp}>
                <option value="">All cohorts</option>
                {cohorts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Course</label>
              <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value, module_id: '' }))} className={inp}>
                <option value="">All courses</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Module</label>
              <select value={form.module_id} onChange={e => setForm(f => ({ ...f, module_id: e.target.value }))} className={inp}>
                <option value="">All modules</option>
                {filteredModules.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
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
            <button onClick={addQ} className="text-sm text-bloomy-600 flex items-center gap-1 hover:text-bloomy-700"><Plus className="w-3.5 h-3.5" />Add Question</button>
          </div>
          {form.questions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
                <input value={q.question} onChange={e => updQ(i, 'question', e.target.value)} className={inp + ' flex-1'} placeholder="Question text..." />
                <select value={q.type} onChange={e => updQ(i, 'type', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none flex-shrink-0 bg-white">
                  {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {form.questions.length > 1 && <button onClick={() => removeQ(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>}
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
      </div>
    )
  }

  // ── LIST VIEW ──
  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveys & Polls</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create feedback forms, pre/post-course surveys and polls</p>
        </div>
        <button onClick={newSurvey} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" />New Survey</button>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No surveys yet — create your first one above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map(s => {
            const typeInfo = SURVEY_TYPES.find(t => t.value === s.type) || SURVEY_TYPES[4]
            const cohortName = cohorts.find((c: any) => c.id === s.cohort_id)?.name
            const surveyUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://bloomylms.vercel.app'}/survey/${s.id}`

            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-bloomy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-bloomy-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900 text-sm">{s.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      {s.is_anonymous && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Anonymous</span>}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Tracking tags */}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-2 flex-wrap">
                      <span>{s.question_count || 0} questions · {s.response_count || 0} responses</span>
                      {cohortName && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">👥 {cohortName}</span>}
                      {s.course_title && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full">📚 {s.course_title}</span>}
                    </div>

                    {/* Copyable survey link */}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 w-fit max-w-full">
                      <Link2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-mono text-gray-500 truncate max-w-xs">{surveyUrl}</span>
                      <button onClick={() => copySurveyLink(s.id)} className="text-bloomy-600 hover:text-bloomy-700 flex-shrink-0 ml-1" title="Copy link">
                        {copied === s.id ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleActive(s.id, s.is_active)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100">
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => loadEdit(s)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500" title="Edit survey">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => viewResults(s)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-purple-50 text-purple-600" title="View results">
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSurvey(s.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400" title="Delete">
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
