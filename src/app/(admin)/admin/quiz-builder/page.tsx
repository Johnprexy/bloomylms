'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2, CheckCircle, ChevronDown, ChevronUp, AlertCircle, X, HelpCircle, RotateCcw } from 'lucide-react'

const Q_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '◉' },
  { value: 'multiple_answer', label: 'Multiple Answer', icon: '☑' },
  { value: 'true_false',      label: 'True / False',   icon: '⇄' },
  { value: 'fill_blank',      label: 'Fill in Blank',  icon: '___' },
  { value: 'short_text',      label: 'Short Answer',   icon: '✏' },
]

const defaultQ = () => ({
  type: 'multiple_choice',
  question: '',
  options: ['', '', '', ''],
  correct_answer: '',
  correct_answers: [] as string[],
  explanation: '',
  points: 1,
})

export default function QuizBuilderPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [courseId, setCourseId] = useState('')
  const [quizTitle, setQuizTitle] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [timeLimit, setTimeLimit] = useState('')
  const [attemptsAllowed, setAttemptsAllowed] = useState(3)
  const [questions, setQuestions] = useState([defaultQ()])
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Existing quizzes for selected course
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/course-builder').then(r => r.json()).then(d => {
      setCourses(d.data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!courseId) { setQuizzes([]); return }
    setLoadingQuizzes(true)
    fetch(`/api/admin/quiz-builder?course_id=${courseId}`).then(r => r.json()).then(d => {
      setQuizzes(d.quizzes || [])
      setLoadingQuizzes(false)
    })
  }, [courseId])

  async function loadQuiz(quizId: string) {
    const d = await fetch(`/api/admin/quiz-builder?quiz_id=${quizId}`).then(r => r.json())
    if (d.data) {
      setEditingQuizId(quizId)
      setQuizTitle(d.data.title || '')
      setPassingScore(d.data.passing_score || 70)
      setTimeLimit(d.data.time_limit_minutes || '')
      setAttemptsAllowed(d.data.attempts_allowed || 3)
      setQuestions(d.data.questions?.length ? d.data.questions.map((q: any) => ({
        type: q.type || 'multiple_choice',
        question: q.question || '',
        options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : ['','','','']),
        correct_answer: q.correct_answer || '',
        correct_answers: Array.isArray(q.correct_answers) ? q.correct_answers : (q.correct_answers ? JSON.parse(q.correct_answers) : []),
        explanation: q.explanation || '',
        points: q.points || 1,
      })) : [defaultQ()])
      setExpanded(new Set([0]))
    }
  }

  function newQuiz() {
    setEditingQuizId(null)
    setQuizTitle('')
    setPassingScore(70)
    setTimeLimit('')
    setAttemptsAllowed(3)
    setQuestions([defaultQ()])
    setExpanded(new Set([0]))
    setError('')
    setSaved(false)
  }

  async function save() {
    if (!courseId) { setError('Select a course first'); return }
    if (!quizTitle.trim()) { setError('Give this quiz a title'); return }
    const valid = questions.filter(q => q.question.trim())
    if (!valid.length) { setError('Add at least one question'); return }
    for (let i = 0; i < valid.length; i++) {
      const q = valid[i]
      if (q.type === 'multiple_choice' && !q.correct_answer) { setError(`Q${i+1}: mark the correct answer`); return }
      if (q.type === 'multiple_answer' && !q.correct_answers.length) { setError(`Q${i+1}: check at least one correct answer`); return }
      if (q.type === 'true_false' && !q.correct_answer) { setError(`Q${i+1}: select True or False`); return }
      if ((q.type === 'fill_blank' || q.type === 'short_text') && !q.correct_answer) { setError(`Q${i+1}: provide the expected answer`); return }
    }
    setError(''); setSaving(true)
    const res = await fetch('/api/admin/quiz-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: courseId, quiz_id: editingQuizId, title: quizTitle,
        passing_score: passingScore, time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
        attempts_allowed: attemptsAllowed, questions: valid,
      }),
    }).then(r => r.json())
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSaved(true); setTimeout(() => setSaved(false), 3000)
    setEditingQuizId(res.data?.quiz_id || editingQuizId)
    // Refresh quiz list
    const d = await fetch(`/api/admin/quiz-builder?course_id=${courseId}`).then(r => r.json())
    setQuizzes(d.quizzes || [])
  }

  // Question helpers
  const addQ = () => { const i = questions.length; setQuestions(q => [...q, defaultQ()]); setExpanded(s => new Set([...s, i])) }
  const removeQ = (i: number) => { setQuestions(q => q.filter((_, j) => j !== i)); setExpanded(s => { const n = new Set(s); n.delete(i); return n }) }
  const updQ = (i: number, k: string, v: any) => setQuestions(qs => qs.map((q, j) => j === i ? { ...q, [k]: v } : q))
  const updOpt = (qi: number, oi: number, v: string) => setQuestions(qs => qs.map((q, j) => {
    if (j !== qi) return q
    const opts = q.options.map((o, k) => k === oi ? v : o)
    const ca = q.correct_answer === q.options[oi] ? v : q.correct_answer
    const cas = q.correct_answers.map((a: string) => a === q.options[oi] ? v : a)
    return { ...q, options: opts, correct_answer: ca, correct_answers: cas }
  }))
  const toggleAns = (qi: number, v: string) => setQuestions(qs => qs.map((q, j) => {
    if (j !== qi) return q
    const has = q.correct_answers.includes(v)
    return { ...q, correct_answers: has ? q.correct_answers.filter((a: string) => a !== v) : [...q.correct_answers, v] }
  }))
  const toggleExp = (i: number) => setExpanded(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'
  const total = questions.reduce((s, q) => s + (q.points || 1), 0)

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage quizzes for any course</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />Saved!</span>}
          <button onClick={save} disabled={saving || !courseId}
            className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingQuizId ? 'Update Quiz' : 'Save Quiz'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Course + quiz selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course *</label>
            <div className="relative">
              <select value={courseId} onChange={e => { setCourseId(e.target.value); newQuiz() }}
                className={inp + ' appearance-none pr-8 cursor-pointer'}>
                <option value="">Select course...</option>
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {courseId && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Existing Quizzes
                <button onClick={newQuiz} className="ml-2 text-xs text-bloomy-600 font-medium hover:underline">+ New Quiz</button>
              </label>
              <div className="relative">
                {loadingQuizzes ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />Loading...
                  </div>
                ) : (
                  <select onChange={e => e.target.value && loadQuiz(e.target.value)}
                    className={inp + ' appearance-none pr-8 cursor-pointer'}
                    value={editingQuizId || ''}>
                    <option value="">— Create new quiz —</option>
                    {quizzes.map((q: any) => <option key={q.id} value={q.id}>{q.title} ({q.question_count} Qs)</option>)}
                  </select>
                )}
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Quiz settings */}
        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quiz Title *</label>
            <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} className={inp} placeholder="e.g. Week 1 Assessment" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Pass Score %</label>
              <input type="number" value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value))} className={inp} min={0} max={100} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Time (mins)</label>
              <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} className={inp} placeholder="∞" min={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Attempts</label>
              <input type="number" value={attemptsAllowed} onChange={e => setAttemptsAllowed(parseInt(e.target.value))} className={inp} min={1} />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{questions.length} Question{questions.length !== 1 ? 's' : ''} · {total} pts total</h2>
          <button onClick={addQ} className="btn-secondary text-sm flex items-center gap-1.5 py-2">
            <Plus className="w-3.5 h-3.5" />Add Question
          </button>
        </div>

        {questions.map((q, i) => {
          const isOpen = expanded.has(i)
          const typeInfo = Q_TYPES.find(t => t.value === q.type) || Q_TYPES[0]
          const hasAnswer = q.type === 'multiple_answer' ? q.correct_answers.length > 0 : !!q.correct_answer
          const answered = q.question.trim() && hasAnswer

          return (
            <div key={i} className={`bg-white rounded-2xl border-2 overflow-hidden transition-colors ${answered ? 'border-gray-100' : q.question.trim() ? 'border-orange-200' : 'border-gray-100'}`}>
              {/* Collapsed header */}
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none" onClick={() => toggleExp(i)}>
                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${answered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {answered ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {q.question || <span className="text-gray-400 italic">Empty question</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{typeInfo.icon} {typeInfo.label} · {q.points} pt{q.points !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {q.question && !hasAnswer && <span className="text-xs text-orange-500 font-medium hidden sm:block">Set answer</span>}
                  {questions.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); removeQ(i) }} className="text-gray-300 hover:text-red-400 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {/* Expanded editor */}
              {isOpen && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  {/* Type + points */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-48">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Question Type</label>
                      <div className="flex flex-wrap gap-1.5">
                        {Q_TYPES.map(t => (
                          <button key={t.value} onClick={() => updQ(i, 'type', t.value)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${q.type === t.value ? 'bg-bloomy-600 text-white border-bloomy-600' : 'bg-white text-gray-600 border-gray-200 hover:border-bloomy-300'}`}>
                            {t.icon} {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Points</label>
                      <input type="number" value={q.points} onChange={e => updQ(i, 'points', parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-bloomy-500" min={1} />
                    </div>
                  </div>

                  {/* Question text */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Question *</label>
                    <textarea value={q.question} onChange={e => updQ(i, 'question', e.target.value)}
                      rows={2} className={inp + ' resize-none'} placeholder="Type your question here..." />
                  </div>

                  {/* MULTIPLE CHOICE */}
                  {q.type === 'multiple_choice' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Options — <span className="text-green-600">click the circle to mark the correct answer</span></label>
                      <div className="space-y-2">
                        {q.options.map((opt: string, oi: number) => (
                          <div key={oi} className="flex items-center gap-2.5">
                            <button onClick={() => opt.trim() && updQ(i, 'correct_answer', opt)}
                              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${q.correct_answer === opt && opt.trim() ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-bloomy-400'}`}>
                              {q.correct_answer === opt && opt.trim() && <div className="w-2 h-2 bg-white rounded-full" />}
                            </button>
                            <input value={opt} onChange={e => updOpt(i, oi, e.target.value)}
                              className={`flex-1 text-sm px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-bloomy-400 ${q.correct_answer === opt && opt.trim() ? 'border-green-400 bg-green-50 font-medium' : 'border-gray-200'}`}
                              placeholder={`Option ${oi + 1}`} />
                            {q.options.length > 2 && (
                              <button onClick={() => updQ(i, 'options', q.options.filter((_: string, k: number) => k !== oi))}
                                className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => updQ(i, 'options', [...q.options, ''])} className="mt-2 text-xs text-bloomy-600 flex items-center gap-1 hover:text-bloomy-700">
                        <Plus className="w-3 h-3" />Add option
                      </button>
                    </div>
                  )}

                  {/* MULTIPLE ANSWER */}
                  {q.type === 'multiple_answer' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Options — <span className="text-green-600">tick ALL correct answers</span></label>
                      <div className="space-y-2">
                        {q.options.map((opt: string, oi: number) => (
                          <div key={oi} className="flex items-center gap-2.5">
                            <button onClick={() => opt.trim() && toggleAns(i, opt)}
                              className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${q.correct_answers.includes(opt) && opt.trim() ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-bloomy-400'}`}>
                              {q.correct_answers.includes(opt) && opt.trim() && <CheckCircle className="w-3 h-3 text-white" />}
                            </button>
                            <input value={opt} onChange={e => updOpt(i, oi, e.target.value)}
                              className={`flex-1 text-sm px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-bloomy-400 ${q.correct_answers.includes(opt) && opt.trim() ? 'border-green-400 bg-green-50 font-medium' : 'border-gray-200'}`}
                              placeholder={`Option ${oi + 1}`} />
                            {q.options.length > 2 && (
                              <button onClick={() => updQ(i, 'options', q.options.filter((_: string, k: number) => k !== oi))}
                                className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => updQ(i, 'options', [...q.options, ''])} className="mt-2 text-xs text-bloomy-600 flex items-center gap-1">
                        <Plus className="w-3 h-3" />Add option
                      </button>
                      {q.correct_answers.length > 0 && <p className="text-xs text-green-600 mt-1">{q.correct_answers.length} correct answer{q.correct_answers.length !== 1 ? 's' : ''} selected</p>}
                    </div>
                  )}

                  {/* TRUE / FALSE */}
                  {q.type === 'true_false' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">Correct Answer</label>
                      <div className="flex gap-3">
                        {['True', 'False'].map(val => (
                          <button key={val} onClick={() => updQ(i, 'correct_answer', val)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${q.correct_answer === val ? (val === 'True' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                            {val === 'True' ? '✓ True' : '✗ False'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FILL IN BLANK */}
                  {q.type === 'fill_blank' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Correct Answer <span className="text-gray-400">(auto-marked, not case-sensitive)</span></label>
                      <input value={q.correct_answer} onChange={e => updQ(i, 'correct_answer', e.target.value)}
                        className={inp} placeholder="Type the expected answer..." />
                      <p className="text-xs text-gray-400 mt-1">Put ___ in your question text to show the blank</p>
                    </div>
                  )}

                  {/* SHORT ANSWER */}
                  {q.type === 'short_text' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Model Answer <span className="text-gray-400">(for manual grading reference)</span></label>
                      <textarea value={q.correct_answer} onChange={e => updQ(i, 'correct_answer', e.target.value)}
                        rows={2} className={inp + ' resize-none'} placeholder="Write the ideal answer..." />
                      <p className="text-xs text-orange-500 mt-1">Short answer questions require manual grading</p>
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Explanation <span className="text-gray-400">(optional — shown to students after submitting)</span>
                    </label>
                    <input value={q.explanation} onChange={e => updQ(i, 'explanation', e.target.value)}
                      className={inp} placeholder="Why is this the correct answer?" />
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Add question button */}
        <button onClick={addQ}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 hover:bg-bloomy-50/30 flex items-center justify-center gap-2 transition-all">
          <Plus className="w-4 h-4" />Add Question
        </button>
      </div>

      {/* Bottom save bar */}
      <div className="sticky bottom-4 bg-white border border-gray-200 rounded-2xl shadow-lg px-5 py-4 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{questions.filter(q => q.question.trim()).length}</span> questions · <span className="font-semibold">{total}</span> pts · pass at <span className="font-semibold">{passingScore}%</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />Saved!</span>}
          <button onClick={save} disabled={saving || !courseId}
            className="btn-primary flex items-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingQuizId ? 'Update Quiz' : 'Save Quiz'}
          </button>
        </div>
      </div>
    </div>
  )
}
