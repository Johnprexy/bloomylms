'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, RotateCcw, Trophy, Loader2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  quizId: string
  lessonId: string
  courseId: string
  userId: string
  onComplete?: (passed: boolean) => void
}

interface Question {
  id: string
  question: string
  type: string
  options: any
  correct_answer: string
  correct_answers?: string[]
  explanation?: string
  points: number
}

export default function QuizComponent({ quizId, lessonId, courseId, userId, onComplete }: Props) {
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [currentQ, setCurrentQ] = useState(0)
  const [resultDetail, setResultDetail] = useState<{ correct: boolean; points: number }[]>([])

  useEffect(() => { fetchQuiz() }, [quizId])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return
    const t = setTimeout(() => setTimeLeft(n => (n || 1) - 1), 1000)
    if (timeLeft === 0) handleSubmit()
    return () => clearTimeout(t)
  }, [timeLeft, submitted])

  async function fetchQuiz() {
    try {
      const [qRes, qsRes, prevRes] = await Promise.all([
        fetch(`/api/quiz/${quizId}`).then(r => r.json()),
        fetch(`/api/quiz/${quizId}/questions`).then(r => r.json()),
        fetch(`/api/quiz/${quizId}/attempts?user=${userId}`).then(r => r.json()),
      ])
      const q = qRes.data
      const qs: Question[] = (qsRes.data || []).map((q: any) => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : []),
        correct_answers: Array.isArray(q.correct_answers) ? q.correct_answers : (q.correct_answers ? JSON.parse(q.correct_answers) : []),
      }))
      setQuiz(q)
      setQuestions(qs)
      const prev = prevRes.data
      setAttemptsUsed(Array.isArray(prev) ? prev.length : 0)
      // Show last passed attempt
      const lastPassed = Array.isArray(prev) && prev.find((a: any) => a.passed && a.completed_at)
      if (lastPassed) {
        setScore(Number(lastPassed.score))
        setPassed(true)
        setSubmitted(true)
        const prevAnswers = typeof lastPassed.answers === 'string' ? JSON.parse(lastPassed.answers) : (lastPassed.answers || {})
        setAnswers(prevAnswers)
      }
      if (q?.time_limit_minutes) setTimeLeft(q.time_limit_minutes * 60)
    } catch (e) { console.error('fetchQuiz error:', e) }
    setLoading(false)
  }

  function gradeQuestion(q: Question, answer: any): { correct: boolean; earned: number } {
    if (!answer && answer !== false) return { correct: false, earned: 0 }

    switch (q.type) {
      case 'multiple_choice':
      case 'true_false': {
        const correct = answer === q.correct_answer
        return { correct, earned: correct ? q.points : 0 }
      }
      case 'multiple_answer': {
        const correctSet = new Set(q.correct_answers || [])
        const userSet = new Set(Array.isArray(answer) ? answer : [answer])
        const allCorrect = [...correctSet].every(a => userSet.has(a)) && [...userSet].every(a => correctSet.has(a))
        return { correct: allCorrect, earned: allCorrect ? q.points : 0 }
      }
      case 'fill_blank': {
        const correct = String(answer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
        return { correct, earned: correct ? q.points : 0 }
      }
      case 'short_text':
        return { correct: false, earned: 0 } // manual grading
      default:
        return { correct: false, earned: 0 }
    }
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)

    const totalPoints = questions.reduce((s, q) => s + q.points, 0)
    let earnedPoints = 0
    const detail = questions.map(q => {
      const { correct, earned } = gradeQuestion(q, answers[q.id])
      earnedPoints += earned
      return { correct, points: earned }
    })

    const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const didPass = scorePercent >= (quiz?.passing_score || 70)

    try {
      await fetch('/api/quiz/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_id: quizId, answers, score: scorePercent,
          passed: didPass, completed_at: new Date().toISOString(),
        }),
      })
    } catch (e) { console.error('Submit error:', e) }

    setScore(scorePercent)
    setPassed(didPass)
    setResultDetail(detail)
    setSubmitted(true)
    setSubmitting(false)
    setAttemptsUsed(a => a + 1)
    if (didPass) onComplete?.(true)
  }

  function retake() {
    if (attemptsUsed >= (quiz?.attempts_allowed || 3)) return
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setPassed(false)
    setResultDetail([])
    setCurrentQ(0)
    if (quiz?.time_limit_minutes) setTimeLeft(quiz.time_limit_minutes * 60)
  }

  function toggleMultiAnswer(qId: string, val: string) {
    setAnswers(a => {
      const cur: string[] = Array.isArray(a[qId]) ? a[qId] : []
      return { ...a, [qId]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] }
    })
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const answeredCount = Object.keys(answers).filter(k => {
    const v = answers[k]
    return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  }).length
  const q = questions[currentQ]
  const totalAttempts = quiz?.attempts_allowed || 3
  const attemptsLeft = totalAttempts - attemptsUsed

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
    </div>
  )

  if (!quiz) return (
    <div className="text-center py-10">
      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      <p className="text-sm text-gray-400">Quiz not found or not yet set up</p>
    </div>
  )

  // ─── RESULTS SCREEN ───
  if (submitted) {
    return (
      <div className="space-y-5">
        {/* Score card */}
        <div className={cn('rounded-2xl p-6 text-center border', passed ? 'bg-green-900/20 border-green-700/40' : 'bg-gray-800 border-gray-700')}>
          {passed
            ? <Trophy className="w-14 h-14 text-yellow-400 mx-auto mb-3" />
            : <XCircle className="w-14 h-14 text-red-400 mx-auto mb-3" />}
          <p className="text-5xl font-bold text-white mb-1">{score}%</p>
          <p className={cn('text-lg font-semibold mb-1', passed ? 'text-green-400' : 'text-red-400')}>
            {passed ? '🎉 Passed!' : 'Not passed'}
          </p>
          <p className="text-sm text-gray-400">Pass mark: {quiz.passing_score}%</p>
          {questions.some(q => q.type === 'short_text') && (
            <p className="text-xs text-yellow-400 mt-2">Note: Short answer questions require manual grading by your instructor</p>
          )}
        </div>

        {/* Question review */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-gray-200">Question Review</h3>
          {questions.map((q, i) => {
            const detail = resultDetail[i]
            const userAns = answers[q.id]
            const isCorrect = detail?.correct ?? false
            const isShort = q.type === 'short_text'

            return (
              <div key={q.id} className={cn('rounded-xl p-4 border text-sm',
                isShort ? 'bg-yellow-900/10 border-yellow-700/30'
                : isCorrect ? 'bg-green-900/20 border-green-700/30'
                : 'bg-red-900/10 border-red-700/20')}>
                <div className="flex items-start gap-2 mb-2">
                  {isShort
                    ? <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    : isCorrect
                    ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                  <p className="text-gray-200 font-medium leading-snug">{i + 1}. {q.question}</p>
                  <span className="ml-auto text-xs text-gray-500 flex-shrink-0">{detail?.points ?? 0}/{q.points} pts</span>
                </div>

                {isShort ? (
                  <div className="ml-6 space-y-1">
                    <p className="text-xs text-gray-400">Your answer: <span className="text-white">{userAns || '—'}</span></p>
                    <p className="text-xs text-yellow-400">Awaiting manual review by instructor</p>
                  </div>
                ) : !isCorrect ? (
                  <div className="ml-6 space-y-1">
                    <p className="text-xs text-red-400">
                      Your answer: {Array.isArray(userAns) ? userAns.join(', ') : (userAns || 'Not answered')}
                    </p>
                    <p className="text-xs text-green-400">
                      Correct: {Array.isArray(q.correct_answers) && q.correct_answers.length ? q.correct_answers.join(', ') : q.correct_answer}
                    </p>
                  </div>
                ) : null}

                {q.explanation && (
                  <p className="ml-6 mt-2 text-xs text-gray-400 italic">{q.explanation}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Retake */}
        {!passed && attemptsLeft > 0 && (
          <button onClick={retake}
            className="w-full flex items-center justify-center gap-2 bg-bloomy-600 hover:bg-bloomy-500 text-white font-semibold py-3 rounded-xl">
            <RotateCcw className="w-4 h-4" />
            Retake Quiz ({attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left)
          </button>
        )}
        {!passed && attemptsLeft <= 0 && (
          <div className="text-center text-sm text-gray-500 py-2">
            <AlertCircle className="w-4 h-4 inline mr-1" />No attempts remaining. Contact your instructor.
          </div>
        )}
      </div>
    )
  }

  // ─── QUIZ TAKING SCREEN ───
  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-white truncate">{quiz.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {questions.length} questions · pass at {quiz.passing_score}% · attempt {attemptsUsed + 1}/{totalAttempts}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{answeredCount}/{questions.length}</span>
          {timeLeft !== null && (
            <div className={cn('font-mono text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5',
              timeLeft < 60 ? 'bg-red-900/50 text-red-400 animate-pulse' : 'bg-gray-700 text-gray-300')}>
              <Clock className="w-3.5 h-3.5" />{formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700">
        <div className="h-1 bg-bloomy-500 transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      {q && (
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <p className="text-sm font-medium text-gray-200 leading-relaxed">
                <span className="text-bloomy-400 font-bold mr-2">{currentQ + 1}.</span>
                {q.question}
              </p>
              <span className="text-xs text-gray-500 flex-shrink-0 mt-0.5">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
            </div>

            {/* MULTIPLE CHOICE */}
            {(q.type === 'multiple_choice' || !q.type) && (
              <div className="space-y-2">
                {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => (
                  <label key={oi} className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
                    answers[q.id] === opt
                      ? 'bg-bloomy-900/40 border-bloomy-500 text-white'
                      : 'bg-gray-700/40 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                  )}>
                    <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                      answers[q.id] === opt ? 'border-bloomy-400 bg-bloomy-500' : 'border-gray-500')}>
                      {answers[q.id] === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                      onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} className="sr-only" />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {/* MULTIPLE ANSWER */}
            {q.type === 'multiple_answer' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 mb-2">Select all correct answers</p>
                {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => {
                  const checked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt)
                  return (
                    <label key={oi} className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all',
                      checked ? 'bg-bloomy-900/40 border-bloomy-500 text-white' : 'bg-gray-700/40 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                    )}>
                      <div className={cn('w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center',
                        checked ? 'border-bloomy-400 bg-bloomy-500' : 'border-gray-500')}>
                        {checked && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <input type="checkbox" checked={checked}
                        onChange={() => toggleMultiAnswer(q.id, opt)} className="sr-only" />
                      <span className="text-sm">{opt}</span>
                    </label>
                  )
                })}
              </div>
            )}

            {/* TRUE / FALSE */}
            {q.type === 'true_false' && (
              <div className="flex gap-3">
                {['True', 'False'].map(val => (
                  <button key={val} onClick={() => setAnswers(a => ({ ...a, [q.id]: val }))}
                    className={cn('flex-1 py-4 rounded-xl text-base font-bold border-2 transition-all',
                      answers[q.id] === val
                        ? val === 'True' ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-red-500 bg-red-900/20 text-red-400'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500 bg-gray-700/40')}>
                    {val === 'True' ? '✓ True' : '✗ False'}
                  </button>
                ))}
              </div>
            )}

            {/* FILL IN THE BLANK */}
            {q.type === 'fill_blank' && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Type your answer below</p>
                <input
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                  placeholder="Your answer..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 focus:border-transparent placeholder:text-gray-500"
                  onKeyDown={e => e.key === 'Enter' && currentQ < questions.length - 1 && setCurrentQ(i => i + 1)}
                />
              </div>
            )}

            {/* SHORT TEXT */}
            {q.type === 'short_text' && (
              <div>
                <p className="text-xs text-yellow-400 mb-2">⚠ Short answer — will be reviewed by your instructor</p>
                <textarea
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                  rows={3}
                  placeholder="Write your answer here..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 resize-none placeholder:text-gray-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation footer */}
      <div className="px-5 py-4 border-t border-gray-700 flex items-center justify-between gap-3">
        <button onClick={() => setCurrentQ(i => Math.max(0, i - 1))} disabled={currentQ === 0}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />Previous
        </button>

        {/* Question dots */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {questions.map((_, i) => {
            const ans = answers[questions[i].id]
            const isAnswered = ans !== undefined && ans !== '' && !(Array.isArray(ans) && ans.length === 0)
            return (
              <button key={i} onClick={() => setCurrentQ(i)}
                className={cn('w-7 h-7 rounded-lg text-xs font-semibold transition-all',
                  i === currentQ ? 'bg-bloomy-600 text-white' :
                  isAnswered ? 'bg-green-700/50 text-green-300' : 'bg-gray-700 text-gray-400 hover:bg-gray-600')}>
                {i + 1}
              </button>
            )
          })}
        </div>

        {currentQ < questions.length - 1 ? (
          <button onClick={() => setCurrentQ(i => i + 1)}
            className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors">
            Next<ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting || answeredCount === 0}
            className="flex items-center gap-2 bg-bloomy-600 hover:bg-bloomy-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Grading...</> : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  )
}
