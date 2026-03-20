'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2, CheckCircle, HelpCircle, X, GripVertical, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'

const Q_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice', desc: 'One correct answer from options', icon: '◉' },
  { value: 'multiple_answer', label: 'Multiple Answer', desc: 'One or more correct answers', icon: '☑' },
  { value: 'true_false', label: 'True / False', desc: 'True or False', icon: '⇄' },
  { value: 'fill_blank', label: 'Fill in the Blank', desc: 'Student types exact answer', icon: '___' },
  { value: 'short_text', label: 'Short Answer', desc: 'Manual grading required', icon: '✏' },
]

interface Question {
  id?: string
  type: string
  question: string
  options: string[]
  correct_answer: string
  correct_answers: string[]
  explanation: string
  points: number
}

interface Props {
  lessonId: string
  lessonTitle: string
  courseId?: string
  onClose: () => void
  onSaved?: () => void
}

const defaultQ = (): Question => ({
  type: 'multiple_choice',
  question: '',
  options: ['', '', '', ''],
  correct_answer: '',
  correct_answers: [],
  explanation: '',
  points: 1,
})

export default function QuizBuilder({ lessonId, lessonTitle, courseId, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [quizId, setQuizId] = useState<string | null>(null)

  // Quiz settings
  const [title, setTitle] = useState('Quiz')
  const [instructions, setInstructions] = useState('')
  const [passingScore, setPassingScore] = useState(70)
  const [timeLimit, setTimeLimit] = useState('')
  const [attemptsAllowed, setAttemptsAllowed] = useState(3)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [showResults, setShowResults] = useState(true)

  const [questions, setQuestions] = useState<Question[]>([defaultQ()])
  const [expandedQ, setExpandedQ] = useState<Set<number>>(new Set([0]))
  const [activeTab, setActiveTab] = useState<'build' | 'settings' | 'results'>('build')
  const [attempts, setAttempts] = useState<any[]>([])

  useEffect(() => {
    if (!lessonId) { setLoading(false); return }
    fetch(`/api/admin/quiz-builder?lesson_id=${lessonId}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setQuizId(d.data.id)
          setTitle(d.data.title || 'Quiz')
          setInstructions(d.data.instructions || '')
          setPassingScore(d.data.passing_score || 70)
          setTimeLimit(d.data.time_limit_minutes || '')
          setAttemptsAllowed(d.data.attempts_allowed || 3)
          setShuffleQuestions(d.data.shuffle_questions || false)
          setShowResults(d.data.show_results ?? true)
          if (d.data.questions?.length) {
            setQuestions(d.data.questions.map((q: any) => ({
              id: q.id,
              type: q.type || 'multiple_choice',
              question: q.question || '',
              options: Array.isArray(q.options)
                ? q.options
                : (typeof q.options === 'string' ? JSON.parse(q.options) : ['', '', '', '']),
              correct_answer: q.correct_answer || '',
              correct_answers: Array.isArray(q.correct_answers)
                ? q.correct_answers
                : (q.correct_answers ? JSON.parse(q.correct_answers) : []),
              explanation: q.explanation || '',
              points: q.points || 1,
            })))
            setExpandedQ(new Set([0]))
          }
          if (d.attempts?.length) setAttempts(d.attempts)
        }
        setLoading(false)
      })
  }, [lessonId])

  async function handleSave() {
    const validQs = questions.filter(q => q.question.trim())
    if (!validQs.length) { setError('Add at least one question'); return }

    // Validate answers
    for (let i = 0; i < validQs.length; i++) {
      const q = validQs[i]
      if (q.type === 'multiple_choice' && !q.correct_answer) {
        setError(`Question ${i + 1}: select the correct answer`); return
      }
      if (q.type === 'multiple_answer' && !q.correct_answers.length) {
        setError(`Question ${i + 1}: select at least one correct answer`); return
      }
      if (q.type === 'true_false' && !q.correct_answer) {
        setError(`Question ${i + 1}: select True or False`); return
      }
      if ((q.type === 'fill_blank' || q.type === 'short_text') && !q.correct_answer) {
        setError(`Question ${i + 1}: provide the expected answer`); return
      }
    }

    setError('')
    setSaving(true)
    const res = await fetch('/api/admin/quiz-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: lessonId,
        course_id: courseId,
        title, instructions, passing_score: passingScore,
        time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
        attempts_allowed: attemptsAllowed,
        shuffle_questions: shuffleQuestions,
        show_results: showResults,
        questions: validQs,
      }),
    }).then(r => r.json())
    setSaving(false)
    if (res.error) { setError(res.error); return }
    if (res.data) {
      setQuizId(res.data.quiz_id)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSaved?.()
    }
  }

  function addQ() {
    const idx = questions.length
    setQuestions(q => [...q, defaultQ()])
    setExpandedQ(s => new Set([...s, idx]))
  }

  function removeQ(i: number) {
    setQuestions(q => q.filter((_, j) => j !== i))
    setExpandedQ(s => { const n = new Set(s); n.delete(i); return n })
  }

  function updQ(i: number, k: keyof Question, v: any) {
    setQuestions(qs => qs.map((q, j) => j === i ? { ...q, [k]: v } : q))
  }

  function updOption(qi: number, oi: number, v: string) {
    setQuestions(qs => qs.map((q, j) => {
      if (j !== qi) return q
      const newOpts = q.options.map((o, k) => k === oi ? v : o)
      // Update correct_answer/correct_answers if they referenced this option
      const newCA = q.correct_answer === q.options[oi] ? v : q.correct_answer
      const newCAs = q.correct_answers.map(a => a === q.options[oi] ? v : a)
      return { ...q, options: newOpts, correct_answer: newCA, correct_answers: newCAs }
    }))
  }

  function toggleAnswer(qi: number, val: string) {
    setQuestions(qs => qs.map((q, j) => {
      if (j !== qi) return q
      const has = q.correct_answers.includes(val)
      return { ...q, correct_answers: has ? q.correct_answers.filter(a => a !== val) : [...q.correct_answers, val] }
    }))
  }

  function addOption(qi: number) {
    setQuestions(qs => qs.map((q, j) => j === qi ? { ...q, options: [...q.options, ''] } : q))
  }

  function removeOption(qi: number, oi: number) {
    setQuestions(qs => qs.map((q, j) => {
      if (j !== qi) return q
      const newOpts = q.options.filter((_, k) => k !== oi)
      return { ...q, options: newOpts, correct_answer: q.options[oi] === q.correct_answer ? '' : q.correct_answer }
    }))
  }

  function toggleExpand(i: number) {
    setExpandedQ(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  }

  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0)
  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500 mx-auto" /></div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-4xl flex flex-col" style={{ maxHeight: '95vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-900 text-lg">Quiz Builder</h2>
              {quizId && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Saved</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{lessonTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Saved!</span>}
            <button onClick={handleSave} disabled={saving}
              className="btn-primary text-sm flex items-center gap-1.5 py-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save Quiz
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0 px-6">
          {[
            { id: 'build', label: `Questions (${questions.length})` },
            { id: 'settings', label: 'Settings' },
            { id: 'results', label: `Results (${attempts.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`text-sm font-medium px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id ? 'border-bloomy-500 text-bloomy-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 py-2">
            <span className="text-xs text-gray-400">{totalPoints} total points</span>
            <span className="text-xs text-gray-400">Pass: {passingScore}%</span>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-2.5 rounded-xl border border-red-100 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* BUILD TAB */}
          {activeTab === 'build' && (
            <>
              {/* Instructions */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Quiz Instructions (shown to students)</label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
                  rows={2} className={inp + ' resize-none bg-white'} placeholder="e.g. Read each question carefully. You have 3 attempts. Passing score is 70%." />
              </div>

              {/* Questions */}
              {questions.map((q, i) => {
                const isExpanded = expandedQ.has(i)
                const typeInfo = Q_TYPES.find(t => t.value === q.type) || Q_TYPES[0]
                const hasAnswer = q.type === 'multiple_answer' ? q.correct_answers.length > 0 : !!q.correct_answer

                return (
                  <div key={i} className={`border-2 rounded-2xl overflow-hidden transition-colors ${hasAnswer ? 'border-gray-200' : 'border-orange-200'}`}>
                    {/* Question header — always visible */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => toggleExpand(i)}>
                      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="w-6 h-6 bg-bloomy-100 text-bloomy-700 rounded-full text-xs font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-sm font-mono text-gray-500 text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full">{typeInfo.icon} {typeInfo.label}</span>
                      </div>
                      <p className="flex-1 text-sm font-medium text-gray-800 truncate">{q.question || <span className="text-gray-400 italic">Empty question</span>}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!hasAnswer && <span className="text-xs text-orange-500 font-medium">No answer set</span>}
                        <span className="text-xs text-gray-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                        {questions.length > 1 && (
                          <button onClick={e => { e.stopPropagation(); removeQ(i) }} className="text-gray-300 hover:text-red-400 p-0.5">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 space-y-4 bg-white">
                        {/* Type + points row */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex-1 min-w-40">
                            <label className="text-xs font-medium text-gray-500 block mb-1">Question Type</label>
                            <select value={q.type} onChange={e => updQ(i, 'type', e.target.value)}
                              className={inp}>
                              {Q_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.icon} {t.label} — {t.desc}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Points</label>
                            <input type="number" value={q.points} onChange={e => updQ(i, 'points', parseInt(e.target.value) || 1)}
                              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-bloomy-500" min={1} />
                          </div>
                        </div>

                        {/* Question text */}
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Question *</label>
                          <textarea value={q.question} onChange={e => updQ(i, 'question', e.target.value)}
                            rows={2} className={inp + ' resize-none'} placeholder="Type your question here..." />
                        </div>

                        {/* MULTIPLE CHOICE */}
                        {q.type === 'multiple_choice' && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-2">Answer Options — click radio to mark correct</label>
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2.5">
                                  <button onClick={() => opt && updQ(i, 'correct_answer', opt)}
                                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                      q.correct_answer === opt && opt ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-bloomy-400'
                                    }`}>
                                    {q.correct_answer === opt && opt && <div className="w-2 h-2 bg-white rounded-full" />}
                                  </button>
                                  <input value={opt} onChange={e => updOption(i, oi, e.target.value)}
                                    className={`flex-1 text-sm px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-bloomy-400 ${
                                      q.correct_answer === opt && opt ? 'border-green-400 bg-green-50' : 'border-gray-200'
                                    }`}
                                    placeholder={`Option ${oi + 1}`} />
                                  {q.options.length > 2 && (
                                    <button onClick={() => removeOption(i, oi)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <button onClick={() => addOption(i)} className="text-xs text-bloomy-600 flex items-center gap-1 hover:text-bloomy-700">
                                <Plus className="w-3 h-3" />Add option
                              </button>
                              {q.correct_answer && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />Correct: "{q.correct_answer}"
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* MULTIPLE ANSWER */}
                        {q.type === 'multiple_answer' && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-2">Answer Options — check ALL correct answers</label>
                            <div className="space-y-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2.5">
                                  <button onClick={() => opt && toggleAnswer(i, opt)}
                                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                      q.correct_answers.includes(opt) && opt ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-bloomy-400'
                                    }`}>
                                    {q.correct_answers.includes(opt) && opt && <CheckCircle className="w-3 h-3 text-white" />}
                                  </button>
                                  <input value={opt} onChange={e => updOption(i, oi, e.target.value)}
                                    className={`flex-1 text-sm px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-bloomy-400 ${
                                      q.correct_answers.includes(opt) && opt ? 'border-green-400 bg-green-50' : 'border-gray-200'
                                    }`}
                                    placeholder={`Option ${oi + 1}`} />
                                  {q.options.length > 2 && (
                                    <button onClick={() => removeOption(i, oi)} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <button onClick={() => addOption(i)} className="text-xs text-bloomy-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add option</button>
                              {q.correct_answers.length > 0 && (
                                <span className="text-xs text-green-600">{q.correct_answers.length} correct answer{q.correct_answers.length !== 1 ? 's' : ''} selected</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* TRUE / FALSE */}
                        {q.type === 'true_false' && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-2">Correct Answer</label>
                            <div className="flex gap-3">
                              {['True', 'False'].map(val => (
                                <button key={val} onClick={() => updQ(i, 'correct_answer', val)}
                                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                                    q.correct_answer === val
                                      ? val === 'True' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                  }`}>
                                  {val === 'True' ? '✓ True' : '✗ False'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* FILL IN THE BLANK */}
                        {q.type === 'fill_blank' && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              Correct Answer <span className="text-gray-400">(auto-marked, case-insensitive)</span>
                            </label>
                            <input value={q.correct_answer} onChange={e => updQ(i, 'correct_answer', e.target.value)}
                              className={inp} placeholder="Type the exact expected answer..." />
                            <p className="text-xs text-gray-400 mt-1">Tip: Use ___ in your question text to show where the blank is</p>
                          </div>
                        )}

                        {/* SHORT TEXT */}
                        {q.type === 'short_text' && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">
                              Model Answer <span className="text-gray-400">(for manual grading reference)</span>
                            </label>
                            <textarea value={q.correct_answer} onChange={e => updQ(i, 'correct_answer', e.target.value)}
                              rows={2} className={inp + ' resize-none'} placeholder="Model answer shown to instructor when grading..." />
                            <p className="text-xs text-orange-500 mt-1">⚠ Short answer questions require manual grading — scores won't be auto-calculated</p>
                          </div>
                        )}

                        {/* Explanation */}
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Explanation <span className="text-gray-400">(shown after submission)</span></label>
                          <input value={q.explanation} onChange={e => updQ(i, 'explanation', e.target.value)}
                            className={inp} placeholder="Why is this the correct answer? (optional)" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <button onClick={addQ}
                className="w-full py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 flex items-center justify-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />Add Question
              </button>
            </>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Quiz Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className={inp} placeholder="e.g. Week 1 Assessment" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Passing Score (%)</label>
                  <input type="number" value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value))} className={inp} min={0} max={100} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Time Limit (minutes)</label>
                  <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} className={inp} placeholder="No limit" min={1} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Attempts</label>
                  <input type="number" value={attemptsAllowed} onChange={e => setAttemptsAllowed(parseInt(e.target.value))} className={inp} min={1} />
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-gray-100">
                {[
                  { key: 'shuffleQuestions', label: 'Shuffle questions for each attempt', val: shuffleQuestions, set: setShuffleQuestions },
                  { key: 'showResults', label: 'Show results and explanations after submission', val: showResults, set: setShowResults },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={opt.val} onChange={e => opt.set(e.target.checked)} className="w-4 h-4 accent-bloomy-600" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && (
            <div>
              {attempts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No attempts yet — students haven't taken this quiz</p>
                </div>
              ) : (
                <div>
                  {/* Summary stats */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Attempts', value: attempts.length },
                      { label: 'Avg Score', value: (attempts.reduce((s, a) => s + Number(a.score || 0), 0) / attempts.length).toFixed(1) + '%' },
                      { label: 'Passed', value: attempts.filter(a => a.passed).length },
                      { label: 'Pass Rate', value: Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100) + '%' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* Attempts table */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full">
                      <thead><tr className="border-b border-gray-100">
                        {['Student','Score','Result','Submitted','Answers'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {attempts.map((att: any) => (
                          <tr key={att.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{att.full_name}</p>
                              <p className="text-xs text-gray-400">{att.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-bold ${att.score >= passingScore ? 'text-green-600' : 'text-red-500'}`}>
                                {Number(att.score).toFixed(0)}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${att.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                {att.passed ? '✓ Passed' : '✗ Failed'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500">
                              {att.completed_at ? new Date(att.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <button onClick={() => {
                                const answers = typeof att.answers === 'string' ? JSON.parse(att.answers) : att.answers
                                alert(JSON.stringify(answers, null, 2))
                              }} className="text-xs text-bloomy-600 hover:underline">View</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
