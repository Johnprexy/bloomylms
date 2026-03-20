'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, ClipboardList, BarChart2, CheckCircle, ChevronDown, ChevronRight, Edit, Eye } from 'lucide-react'

const SURVEY_TYPES = [
  { value: 'pre_course', label: 'Pre-course Survey', color: 'bg-blue-50 text-blue-700' },
  { value: 'post_course', label: 'Post-course Survey', color: 'bg-green-50 text-green-700' },
  { value: 'feedback', label: 'Feedback Form', color: 'bg-purple-50 text-purple-700' },
  { value: 'poll', label: 'Poll', color: 'bg-orange-50 text-orange-700' },
  { value: 'general', label: 'General', color: 'bg-gray-100 text-gray-700' },
]

const Q_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'rating', label: 'Rating (1–5)' },
  { value: 'yes_no', label: 'Yes / No' },
]

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'create' | 'results'>('list')
  const [selected, setSelected] = useState<any>(null)
  const [results, setResults] = useState<any>(null)

  const [form, setForm] = useState({
    title: '', description: '', type: 'feedback', course_id: '', is_anonymous: true,
    questions: [{ question: '', type: 'multiple_choice', options: ['', ''], required: true }]
  })

  useEffect(() => {
    fetch('/api/admin/surveys').then(r => r.json()).then(d => {
      setSurveys(d.surveys || [])
      setCourses(d.courses || [])
      setLoading(false)
    })
  }, [])

  async function saveSurvey() {
    const res = await fetch('/api/admin/surveys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json())
    if (res.data) {
      setSurveys(prev => [res.data, ...prev])
      setView('list')
      resetForm()
    }
  }

  async function viewResults(survey: any) {
    setSelected(survey)
    const d = await fetch(`/api/admin/surveys?id=${survey.id}`).then(r => r.json())
    setResults(d)
    setView('results')
  }

  async function toggleSurvey(id: string, is_active: boolean) {
    await fetch('/api/admin/surveys', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    setSurveys(s => s.map(x => x.id === id ? { ...x, is_active: !is_active } : x))
  }

  function resetForm() {
    setForm({ title: '', description: '', type: 'feedback', course_id: '', is_anonymous: true, questions: [{ question: '', type: 'multiple_choice', options: ['', ''], required: true }] })
  }

  function addQuestion() {
    setForm(f => ({ ...f, questions: [...f.questions, { question: '', type: 'multiple_choice', options: ['', ''], required: true }] }))
  }

  function updateQ(i: number, k: string, v: any) {
    setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === i ? { ...q, [k]: v } : q) }))
  }

  function addOption(qi: number) {
    setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === qi ? { ...q, options: [...(q.options || []), ''] } : q) }))
  }

  function updateOption(qi: number, oi: number, v: string) {
    setForm(f => ({ ...f, questions: f.questions.map((q, j) => j === qi ? { ...q, options: q.options.map((o: string, k: number) => k === oi ? v : o) } : q) }))
  }

  function removeQ(i: number) {
    setForm(f => ({ ...f, questions: f.questions.filter((_, j) => j !== i) }))
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  if (view === 'results' && selected && results) {
    return (
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('list')} className="text-sm text-bloomy-600 hover:underline">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Results: {selected.title}</h1>
          <span className="text-sm text-gray-400">{results.total_responses} responses</span>
        </div>
        {results.questions?.map((q: any, i: number) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-semibold text-gray-900 mb-4 text-sm">{i + 1}. {q.question}</p>
            {q.type === 'multiple_choice' || q.type === 'yes_no' ? (
              <div className="space-y-2">
                {q.options?.map((opt: string) => {
                  const count = results.answers?.filter((a: any) => a.question_id === q.id && a.answer === opt).length || 0
                  const pct = results.total_responses > 0 ? Math.round((count / results.total_responses) * 100) : 0
                  return (
                    <div key={opt} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-32 flex-shrink-0">{opt}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="h-6 bg-bloomy-500 rounded-lg flex items-center px-2" style={{ width: `${Math.max(pct, 3)}%` }}>
                          {pct > 10 && <span className="text-xs text-white font-medium">{pct}%</span>}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            ) : q.type === 'rating' ? (
              <div className="flex items-center gap-4">
                {[1,2,3,4,5].map(n => {
                  const count = results.answers?.filter((a: any) => a.question_id === q.id && parseInt(a.answer) === n).length || 0
                  return (
                    <div key={n} className="text-center">
                      <div className="text-2xl font-bold text-bloomy-600">{count}</div>
                      <div className="text-xs text-gray-400">{'★'.repeat(n)}</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.answers?.filter((a: any) => a.question_id === q.id).map((a: any, j: number) => (
                  <p key={j} className="text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">{a.answer}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (view === 'create') {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('list'); resetForm() }} className="text-sm text-bloomy-600 hover:underline">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Create Survey</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Survey Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inp} placeholder="e.g. Post-Course Feedback — DevOps Bootcamp" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                {SURVEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course (optional)</label>
              <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))} className={inp}>
                <option value="">All courses / General</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inp + ' resize-none'} placeholder="Brief intro shown to students..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="anon" checked={form.is_anonymous} onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))} className="accent-bloomy-600 w-4 h-4" />
              <label htmlFor="anon" className="text-sm text-gray-700 cursor-pointer">Anonymous responses</label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Questions ({form.questions.length})</h2>
            <button onClick={addQuestion} className="text-sm text-bloomy-600 flex items-center gap-1 hover:text-bloomy-700"><Plus className="w-3.5 h-3.5" />Add Question</button>
          </div>
          {form.questions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                <input value={q.question} onChange={e => updateQ(i, 'question', e.target.value)} className={inp + ' flex-1'} placeholder="Question text..." />
                <select value={q.type} onChange={e => updateQ(i, 'type', e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none flex-shrink-0">
                  {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {form.questions.length > 1 && <button onClick={() => removeQ(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>}
              </div>
              {(q.type === 'multiple_choice') && (
                <div className="pl-6 space-y-2">
                  {q.options?.map((opt: string, oi: number) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0" />
                      <input value={opt} onChange={e => updateOption(i, oi, e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400" placeholder={`Option ${oi + 1}`} />
                    </div>
                  ))}
                  <button onClick={() => addOption(i)} className="text-xs text-bloomy-600 flex items-center gap-1 pl-7 hover:text-bloomy-700"><Plus className="w-3 h-3" />Add option</button>
                </div>
              )}
              <div className="flex items-center gap-2 pl-6">
                <input type="checkbox" checked={q.required} onChange={e => updateQ(i, 'required', e.target.checked)} className="accent-bloomy-600 w-3.5 h-3.5" />
                <span className="text-xs text-gray-500">Required</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pb-6">
          <button onClick={saveSurvey} disabled={!form.title || !form.questions.length} className="btn-primary flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4" />Save Survey</button>
          <button onClick={() => { setView('list'); resetForm() }} className="btn-secondary text-sm">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveys & Polls</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create feedback forms, pre/post-course surveys and polls</p>
        </div>
        <button onClick={() => setView('create')} className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" />New Survey</button>
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
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-11 h-11 bg-bloomy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-bloomy-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm">{s.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                    {s.is_anonymous && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Anonymous</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.course_title || 'All courses'} · {s.response_count || 0} responses · {s.question_count || 0} questions</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button onClick={() => toggleSurvey(s.id, s.is_active)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100">
                    {s.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => viewResults(s)} className="text-xs text-bloomy-600 hover:text-bloomy-700 px-3 py-1.5 rounded-lg hover:bg-bloomy-50 flex items-center gap-1">
                    <BarChart2 className="w-3.5 h-3.5" />Results
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
