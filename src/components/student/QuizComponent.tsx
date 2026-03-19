'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, RotateCcw, Trophy, Loader2, AlertCircle } from 'lucide-react'
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
  options: { label: string; value: string }[]
  correct_answer: string
  explanation?: string
  points: number
}

export default function QuizComponent({ quizId, lessonId, courseId, userId, onComplete }: Props) {
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [attempt, setAttempt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [attemptsUsed, setAttemptsUsed] = useState(0)

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return
    const timer = setTimeout(() => setTimeLeft(t => (t || 1) - 1), 1000)
    if (timeLeft === 0) handleSubmit()
    return () => clearTimeout(timer)
  }, [timeLeft, submitted])

  async function fetchQuiz() {
    const supabase = createClient()
    const [{ data: q }, { data: qs }, { data: prev }] = await Promise.all([
      supabase.from('quizzes').select('*').eq('id', quizId).single(),
      supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('position'),
      supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('student_id', userId).order('started_at', { ascending: false }),
    ])
    setQuiz(q)
    setQuestions(qs || [])
    setAttemptsUsed(prev?.length || 0)

    const lastAttempt = prev?.[0]
    if (lastAttempt?.completed_at && lastAttempt.passed) {
      setAttempt(lastAttempt)
      setScore(lastAttempt.score)
      setPassed(true)
      setSubmitted(true)
      setAnswers(lastAttempt.answers || {})
    }

    if (q?.time_limit_minutes) setTimeLeft(q.time_limit_minutes * 60)
    setLoading(false)
  }

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    const supabase = createClient()

    const totalPoints = questions.reduce((s, q) => s + q.points, 0)
    const earned = questions.reduce((s, q) => {
      return s + (answers[q.id] === q.correct_answer ? q.points : 0)
    }, 0)
    const scorePercent = totalPoints > 0 ? Math.round((earned / totalPoints) * 100) : 0
    const didPass = scorePercent >= (quiz?.passing_score || 70)

    const { data: att } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: userId,
        answers,
        score: scorePercent,
        passed: didPass,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    setAttempt(att)
    setScore(scorePercent)
    setPassed(didPass)
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
    setAttempt(null)
    if (quiz?.time_limit_minutes) setTimeLeft(quiz.time_limit_minutes * 60)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const answeredCount = Object.keys(answers).length

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    </div>
  )

  if (!quiz) return (
    <div className="text-center py-8 text-gray-500">
      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
      <p className="text-sm">Quiz not found</p>
    </div>
  )

  // Results screen
  if (submitted) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className={cn('text-center mb-6 p-6 rounded-xl', passed ? 'bg-green-900/30 border border-green-700/40' : 'bg-red-900/20 border border-red-700/30')}>
          {passed ? (
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          ) : (
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          )}
          <h3 className={cn('text-2xl font-bold mb-1', passed ? 'text-green-400' : 'text-red-400')}>
            {passed ? 'Passed! 🎉' : 'Not quite yet'}
          </h3>
          <p className="text-4xl font-bold text-white mb-1">{score}%</p>
          <p className="text-sm text-gray-400">Passing score: {quiz.passing_score}%</p>
        </div>

        {/* Question review */}
        <div className="space-y-4 mb-6">
          {questions.map((q, i) => {
            const userAns = answers[q.id]
            const isCorrect = userAns === q.correct_answer
            return (
              <div key={q.id} className={cn('rounded-xl p-4 border', isCorrect ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/10 border-red-700/20')}>
                <div className="flex items-start gap-2 mb-3">
                  {isCorrect ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}
                  <p className="text-sm font-medium text-gray-200">{i + 1}. {q.question}</p>
                </div>
                {!isCorrect && (
                  <div className="ml-6 space-y-1">
                    <p className="text-xs text-red-400">Your answer: {userAns || 'Not answered'}</p>
                    <p className="text-xs text-green-400">Correct: {q.correct_answer}</p>
                  </div>
                )}
                {q.explanation && !isCorrect && (
                  <p className="ml-6 mt-2 text-xs text-gray-400 bg-gray-700/50 rounded-lg px-3 py-2">{q.explanation}</p>
                )}
              </div>
            )
          })}
        </div>

        {!passed && attemptsUsed < (quiz.attempts_allowed || 3) && (
          <button onClick={retake} className="w-full flex items-center justify-center gap-2 bg-bloomy-600 hover:bg-bloomy-500 text-white font-medium py-3 rounded-xl transition-colors">
            <RotateCcw className="w-4 h-4" />
            Retake Quiz ({quiz.attempts_allowed - attemptsUsed} attempt{quiz.attempts_allowed - attemptsUsed !== 1 ? 's' : ''} left)
          </button>
        )}

        {!passed && attemptsUsed >= (quiz.attempts_allowed || 3) && (
          <div className="text-center text-sm text-gray-500 py-3">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            No attempts remaining. Review the material and contact your instructor.
          </div>
        )}
      </div>
    )
  }

  // Quiz taking screen
  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">{quiz.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {questions.length} questions • Pass at {quiz.passing_score}% •
            Attempt {attemptsUsed + 1} of {quiz.attempts_allowed}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{answeredCount}/{questions.length} answered</span>
          {timeLeft !== null && (
            <div className={cn('flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1.5 rounded-lg', timeLeft < 60 ? 'bg-red-900/40 text-red-400' : 'bg-gray-700 text-gray-300')}>
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
        {questions.map((q, i) => (
          <div key={q.id}>
            <p className="text-sm font-medium text-gray-200 mb-3">
              <span className="text-bloomy-400 font-bold mr-1.5">{i + 1}.</span>
              {q.question}
              <span className="ml-2 text-xs text-gray-500">({q.points} pt{q.points !== 1 ? 's' : ''})</span>
            </p>
            <div className="space-y-2">
              {q.options?.map(opt => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    answers[q.id] === opt.value
                      ? 'bg-bloomy-900/40 border-bloomy-500 text-white'
                      : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.value}
                    checked={answers[q.id] === opt.value}
                    onChange={() => setAnswers(a => ({ ...a, [q.id]: opt.value }))}
                    className="sr-only"
                  />
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                    answers[q.id] === opt.value ? 'border-bloomy-400 bg-bloomy-500' : 'border-gray-500'
                  )}>
                    {answers[q.id] === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {answeredCount < questions.length && `${questions.length - answeredCount} unanswered question${questions.length - answeredCount !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting || answeredCount === 0}
          className="flex items-center gap-2 bg-bloomy-600 hover:bg-bloomy-500 text-white font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Grading...</> : 'Submit Quiz'}
        </button>
      </div>
    </div>
  )
}
