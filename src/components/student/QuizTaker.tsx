'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle, XCircle, Trophy,
  AlertCircle, Loader2, RotateCcw, BookOpen, ArrowRight, HelpCircle } from 'lucide-react'

interface Props {
  quizId: string; courseId: string; userId: string
  onComplete?: (passed: boolean, score: number) => void
}

type Phase = 'pre'|'taking'|'submitting'|'results'

export default function QuizTaker({ quizId, courseId, userId, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('pre')
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [prevAttempts, setPrevAttempts] = useState<any[]>([])
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [startTime, setStartTime] = useState<number>(0)
  const [tabWarnings, setTabWarnings] = useState(0)
  const autoSaveRef = useRef<NodeJS.Timeout>()

  useEffect(() => { loadQuiz() }, [quizId])

  // Timer
  useEffect(() => {
    if (phase !== 'taking' || timeLeft === null || timeLeft <= 0) return
    const t = setInterval(() => {
      setTimeLeft(n => {
        if ((n || 0) <= 1) { clearInterval(t); handleSubmit(true); return 0 }
        return (n || 0) - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [phase, timeLeft])

  // Auto-save every 15s
  useEffect(() => {
    if (phase !== 'taking' || !attemptId) return
    autoSaveRef.current = setInterval(() => {
      fetch(`/api/v2/attempts/${attemptId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) })
    }, 15000)
    return () => clearInterval(autoSaveRef.current)
  }, [phase, attemptId, answers])

  // Tab visibility warning
  useEffect(() => {
    if (phase !== 'taking') return
    const handle = () => {
      if (document.hidden) {
        setTabWarnings(n => {
          const next = n + 1
          if (next >= 3) { handleSubmit(true); return next }
          return next
        })
      }
    }
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [phase])

  async function loadQuiz() {
    const [qRes, aRes] = await Promise.all([
      fetch(`/api/v2/quizzes/${quizId}`).then(r => r.json()),
      fetch(`/api/v2/quizzes/${quizId}/attempts`).then(r => r.json()),
    ])
    setQuiz(qRes.data)
    setQuestions(qRes.data?.questions || [])
    setPrevAttempts(aRes.data || [])
    setLoading(false)
  }

  async function startQuiz() {
    const res = await fetch(`/api/v2/quizzes/${quizId}/attempts`, { method: 'POST' }).then(r => r.json())
    if (res.error) { alert(res.error); return }
    setAttemptId(res.data.id)
    if (res.resumed && res.data.answers) {
      try { setAnswers(typeof res.data.answers === 'string' ? JSON.parse(res.data.answers) : res.data.answers) } catch {}
    }
    if (quiz.time_limit_minutes) setTimeLeft(quiz.time_limit_minutes * 60)
    setStartTime(Date.now())
    setPhase('taking')
    setCurrentQ(0)
  }

  async function handleSubmit(auto = false) {
    if (submitting) return
    if (!auto && !confirm('Submit quiz? You cannot change your answers after submitting.')) return
    setSubmitting(true)
    setPhase('submitting')
    const timeTaken = Math.round((Date.now() - startTime) / 1000)
    const res = await fetch(`/api/v2/attempts/${attemptId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, time_taken_seconds: timeTaken })
    }).then(r => r.json())
    setSubmitting(false)
    if (res.data) {
      setResults(res.data)
      setPhase('results')
      if (res.data.passed) onComplete?.(true, res.data.score)
    }
  }

  function setAnswer(qId: string, val: any) {
    setAnswers(a => ({ ...a, [qId]: val }))
  }

  function toggleMultiSelect(qId: string, optId: string) {
    setAnswers(a => {
      const cur: string[] = Array.isArray(a[qId]) ? a[qId] : []
      return { ...a, [qId]: cur.includes(optId) ? cur.filter((x: string) => x !== optId) : [...cur, optId] }
    })
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const answeredCount = Object.keys(answers).filter(k => { const v = answers[k]; return v !== undefined && v !== '' && !(Array.isArray(v) && !v.length) }).length
  const q = questions[currentQ]

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
  if (!quiz) return <div className="text-center py-8 text-gray-400"><HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Quiz not found</p></div>

  // PRE-QUIZ SCREEN
  if (phase === 'pre') {
    const canAttempt = quiz.max_attempts <= 0 || prevAttempts.filter((a: any) => a.status !== 'abandoned').length < quiz.max_attempts
    const bestScore = prevAttempts.length ? Math.max(...prevAttempts.filter((a: any) => a.final_score).map((a: any) => parseFloat(a.final_score || 0))) : null
    const passed = prevAttempts.some((a: any) => a.passed)
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-gradient-to-br from-bloomy-600 to-blue-600 text-white rounded-2xl p-7">
          <HelpCircle className="w-10 h-10 text-white/60 mb-3" />
          <h2 className="text-2xl font-bold mb-1">{quiz.title}</h2>
          {quiz.description && <p className="text-white/70 text-sm">{quiz.description}</p>}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/80">
            <span>{questions.length} questions</span>
            {quiz.time_limit_minutes && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{quiz.time_limit_minutes} min</span>}
            <span>Pass: {quiz.passing_score}%</span>
            <span>{quiz.max_attempts} attempt{quiz.max_attempts !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {quiz.instructions && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-2">Instructions</p>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{quiz.instructions}</p>
          </div>
        )}

        {prevAttempts.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Previous Attempts</p>
            {prevAttempts.slice(0, 5).map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">Attempt #{a.attempt_number}</span>
                <span className={`text-sm font-bold ${a.passed ? 'text-green-600' : 'text-red-500'}`}>{Math.round(a.final_score || a.auto_score || 0)}%</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{a.passed ? 'Passed' : 'Failed'}</span>
                <span className="text-xs text-gray-400 ml-auto">{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : 'In progress'}</span>
              </div>
            ))}
          </div>
        )}

        {passed && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <Trophy className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div><p className="font-semibold text-green-800 text-sm">Already passed!</p>
              <p className="text-xs text-green-600">Best score: {bestScore}% · {canAttempt ? 'You can still retake' : 'No attempts remaining'}</p></div>
          </div>
        )}

        {canAttempt ? (
          <button onClick={startQuiz} className="w-full btn-primary py-4 text-base font-semibold flex items-center justify-center gap-2 rounded-2xl">
            {prevAttempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'} <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center text-sm text-gray-500">
            <p>No attempts remaining. Contact your instructor if needed.</p>
          </div>
        )}
      </div>
    )
  }

  // SUBMITTING SCREEN
  if (phase === 'submitting') return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-bloomy-500" />
      <p className="text-lg font-semibold text-gray-700">Submitting your answers...</p>
      <p className="text-sm text-gray-400">Grading in progress</p>
    </div>
  )

  // RESULTS SCREEN — loads INSTANTLY, no extra fetch needed
  if (phase === 'results' && results) {
    const score = results.score
    const passed = results.passed
    const hasManual = results.has_manual
    const details: any[] = results.answer_details || []
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Score card */}
        <div className={`rounded-2xl p-7 text-center ${passed ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-gray-700 to-gray-800'} text-white`}>
          {passed ? <Trophy className="w-14 h-14 text-yellow-300 mx-auto mb-3" /> : <XCircle className="w-14 h-14 text-red-300 mx-auto mb-3" />}
          <p className="text-6xl font-black mb-2">{score}%</p>
          <p className={`text-xl font-bold mb-1 ${passed ? 'text-green-100' : 'text-gray-200'}`}>{passed ? '🎉 Passed!' : 'Not passed'}</p>
          <p className="text-white/60 text-sm">Pass mark: {quiz.passing_score}%</p>
          {hasManual && (
            <div className="mt-4 bg-white/20 rounded-xl px-4 py-2.5 text-sm">
              <p className="font-semibold">Partial score — manual grading pending</p>
              <p className="text-white/70 text-xs mt-0.5">Your instructor is reviewing written answers. Final score will update once graded.</p>
            </div>
          )}
        </div>

        {/* Per question review */}
        {quiz.show_results_immediately && details.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-gray-900">Question Review</h3>
            {questions.map((q: any, i: number) => {
              const d = details.find((x: any) => x.qid === q.id)
              const isManual = q.requires_manual_grading
              const isCorrect = d?.is_correct
              const userAns = answers[q.id]
              return (
                <div key={q.id} className={`rounded-2xl border p-5 ${isManual ? 'border-yellow-200 bg-yellow-50/50' : isCorrect ? 'border-green-200 bg-green-50/50' : 'border-red-100 bg-red-50/30'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    {isManual ? <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" /> :
                     isCorrect ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> :
                     <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm leading-snug">{i+1}. {q.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{d?.auto_score ?? '?'}/{q.points} pts</span>
                        {isManual && <span className="text-xs text-yellow-600 font-medium">Awaiting manual grading</span>}
                      </div>
                    </div>
                  </div>
                  {!isManual && !isCorrect && quiz.show_correct_answers === 'immediately' && (
                    <div className="ml-8 space-y-1.5">
                      <p className="text-xs text-red-500">Your answer: {Array.isArray(userAns) ? (userAns.length ? userAns.join(', ') : 'Not answered') : (userAns || 'Not answered')}</p>
                      {q.options?.filter((o: any) => o.is_correct).length > 0 && (
                        <p className="text-xs text-green-600">Correct: {q.options.filter((o: any) => o.is_correct).map((o: any) => o.text).join(', ')}</p>
                      )}
                      {q.explanation && quiz.show_explanations && <p className="text-xs text-gray-500 italic mt-1.5 bg-white/60 rounded-xl px-3 py-2">{q.explanation}</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!passed && prevAttempts.length < quiz.max_attempts && (
            <button onClick={() => { setPhase('pre'); loadQuiz() }} className="flex-1 flex items-center justify-center gap-2 bg-bloomy-600 hover:bg-bloomy-700 text-white font-semibold py-3.5 rounded-2xl">
              <RotateCcw className="w-4 h-4" />Try Again
            </button>
          )}
          <button onClick={() => onComplete?.(passed, score)} className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3.5 rounded-2xl ${passed ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <BookOpen className="w-4 h-4" />Continue Course
          </button>
        </div>
      </div>
    )
  }

  // QUIZ TAKING SCREEN
  if (!q) return null
  const opts = Array.isArray(q.options) ? q.options : []
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between gap-3">
        <div>
          <p className="font-bold text-white text-sm">{quiz.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">Question {currentQ + 1} of {questions.length} · {answeredCount} answered</p>
        </div>
        <div className="flex items-center gap-2">
          {tabWarnings > 0 && <span className="text-xs text-orange-400 bg-orange-900/40 px-2 py-1 rounded-lg">⚠ {tabWarnings} tab switch{tabWarnings !== 1 ? 'es' : ''} detected</span>}
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1.5 rounded-lg ${timeLeft < 60 ? 'bg-red-900/50 text-red-400 animate-pulse' : 'bg-gray-800 text-gray-200'}`}>
              <Clock className="w-3.5 h-3.5" />{formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <div className="h-1 bg-bloomy-500 transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-white font-medium leading-relaxed flex-1">
            <span className="text-bloomy-400 font-bold mr-2">{currentQ + 1}.</span>{q.text}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-500">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
            <button onClick={() => setFlagged(s => { const n = new Set(s); n.has(currentQ) ? n.delete(currentQ) : n.add(currentQ); return n })}
              className={`p-1.5 rounded-lg transition-colors ${flagged.has(currentQ) ? 'text-yellow-400 bg-yellow-900/30' : 'text-gray-500 hover:text-gray-300'}`} title="Flag for review">
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hint */}
        {q.hint_text && (
          <details className="text-xs">
            <summary className="text-yellow-400 cursor-pointer hover:text-yellow-300">💡 Show hint {q.hint_penalty > 0 ? `(−${q.hint_penalty} pts)` : ''}</summary>
            <p className="text-gray-400 mt-1.5 pl-4">{q.hint_text}</p>
          </details>
        )}

        {/* MCQ */}
        {(q.type === 'mcq' || q.type === 'true_false') && (
          <div className="space-y-2">
            {opts.map((opt: any) => (
              <label key={opt.id} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-all ${answers[q.id] === opt.id ? 'border-bloomy-500 bg-bloomy-900/40 text-white' : 'border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${answers[q.id] === opt.id ? 'border-bloomy-400 bg-bloomy-500' : 'border-gray-600'}`}>
                  {answers[q.id] === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <input type="radio" name={q.id} value={opt.id} checked={answers[q.id] === opt.id} onChange={() => setAnswer(q.id, opt.id)} className="sr-only" />
                <span className="text-sm">{opt.text}</span>
              </label>
            ))}
          </div>
        )}

        {/* Multi select */}
        {q.type === 'multi_select' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Select all that apply</p>
            {opts.map((opt: any) => {
              const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt.id)
              return (
                <label key={opt.id} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-all ${checked ? 'border-bloomy-500 bg-bloomy-900/40 text-white' : 'border-gray-700 text-gray-300 hover:border-gray-600'}`}>
                  <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${checked ? 'border-bloomy-400 bg-bloomy-500' : 'border-gray-600'}`}>
                    {checked && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" checked={checked} onChange={() => toggleMultiSelect(q.id, opt.id)} className="sr-only" />
                  <span className="text-sm">{opt.text}</span>
                </label>
              )
            })}
          </div>
        )}

        {/* Short answer */}
        {q.type === 'short_answer' && (
          <input value={answers[q.id] || ''} onChange={e => setAnswer(q.id, e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 placeholder:text-gray-500"
            placeholder="Type your answer..." />
        )}

        {/* Essay */}
        {q.type === 'essay' && (
          <div>
            <textarea value={answers[q.id] || ''} onChange={e => setAnswer(q.id, e.target.value)} rows={5}
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 resize-none placeholder:text-gray-500"
              placeholder="Write your answer here..." />
            {q.word_limit && <p className="text-xs text-gray-500 mt-1 text-right">{(answers[q.id] || '').split(/\s+/).filter(Boolean).length} / {q.word_limit} words</p>}
            <p className="text-xs text-yellow-400 mt-1.5">This question will be manually graded by your instructor</p>
          </div>
        )}

        {/* Ordering */}
        {q.type === 'ordering' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Arrange in the correct order</p>
            {opts.map((opt: any, oi: number) => {
              const userOrder: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : opts.map((o: any) => o.id)
              const pos = userOrder.indexOf(opt.id)
              return (
                <div key={opt.id} className="flex items-center gap-3 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3">
                  <span className="w-6 h-6 rounded-full bg-bloomy-900 text-bloomy-400 text-xs font-bold flex items-center justify-center">{pos + 1}</span>
                  <span className="flex-1 text-sm text-gray-200">{opt.text}</span>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => { const cur = [...userOrder]; if (pos > 0) { [cur[pos-1], cur[pos]] = [cur[pos], cur[pos-1]]; setAnswer(q.id, cur) } }} disabled={pos === 0} className="text-gray-500 hover:text-gray-300 disabled:opacity-20">▲</button>
                    <button onClick={() => { const cur = [...userOrder]; if (pos < cur.length-1) { [cur[pos+1], cur[pos]] = [cur[pos], cur[pos+1]]; setAnswer(q.id, cur) } }} disabled={pos === userOrder.length - 1} className="text-gray-500 hover:text-gray-300 disabled:opacity-20">▼</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Matching */}
        {q.type === 'matching' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Match each item on the left to its correct answer</p>
            {opts.map((opt: any) => (
              <div key={opt.id} className="flex items-center gap-3">
                <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200">{opt.text}</div>
                <span className="text-gray-500 flex-shrink-0">→</span>
                <select value={(answers[q.id] || {})[opt.id] || ''} onChange={e => setAnswer(q.id, { ...(answers[q.id] || {}), [opt.id]: e.target.value })}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-bloomy-500">
                  <option value="">Select answer...</option>
                  {opts.map((o: any) => <option key={o.id} value={o.match_text}>{o.match_text}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* File upload */}
        {q.type === 'file_upload' && (
          <div className="bg-gray-800 border border-dashed border-gray-600 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400 mb-2">File upload will be available once you save your answers</p>
            <p className="text-xs text-gray-500">Accepted: {(q.accepted_files || ['pdf','docx','jpg']).join(', ').toUpperCase()}</p>
          </div>
        )}
      </div>

      {/* Navigation footer */}
      <div className="px-5 py-4 border-t border-gray-700 flex items-center justify-between gap-3">
        <button onClick={() => setCurrentQ(i => Math.max(0, i - 1))} disabled={currentQ === 0}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 py-2 px-3 rounded-xl hover:bg-gray-800">
          <ChevronLeft className="w-4 h-4" />Previous
        </button>

        {/* Dots */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {questions.map((_: any, i: number) => {
            const ans = answers[questions[i].id]
            const isAns = ans !== undefined && ans !== '' && !(Array.isArray(ans) && !ans.length)
            return (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${i === currentQ ? 'bg-bloomy-600 text-white' : flagged.has(i) ? 'bg-yellow-700/50 text-yellow-300' : isAns ? 'bg-green-700/50 text-green-300' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                {i + 1}
              </button>
            )
          })}
        </div>

        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ(i => i + 1)} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white py-2 px-3 rounded-xl hover:bg-gray-800">
            Next<ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => handleSubmit()} disabled={submitting || answeredCount === 0}
            className="flex items-center gap-2 bg-bloomy-600 hover:bg-bloomy-500 text-white font-semibold px-5 py-2.5 rounded-xl disabled:opacity-50">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Grading...</> : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}
