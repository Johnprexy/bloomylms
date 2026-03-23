'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Loader2, Star, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function SurveyPage() {
  const { id } = useParams()
  const [survey, setSurvey] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/surveys/public?id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        setSurvey(d.survey)
        setQuestions(d.questions || [])
        setLoading(false)
      })
      .catch(() => { setError('Failed to load survey'); setLoading(false) })
  }, [id])

  async function submit() {
    // Validate required
    for (const q of questions) {
      if (q.required && !answers[q.id] && answers[q.id] !== 0) {
        setError(`Please answer: "${q.question}"`)
        return
      }
    }
    setError('')
    setSubmitting(true)
    const res = await fetch('/api/surveys/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ survey_id: id, answers }),
    }).then(r => r.json())
    setSubmitting(false)
    if (res.error) { setError(res.error); return }
    setSubmitted(true)
  }

  const inp = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white'

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-bloomy-500" />
    </div>
  )

  if (error && !survey) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Survey not found</h1>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h1>
        <p className="text-gray-500">Your response has been recorded. We appreciate your feedback.</p>
        <img src="/bloomy-logo.jpg" alt="Bloomy" className="w-12 h-12 rounded-xl object-cover mx-auto mt-8" />
        <p className="text-xs text-gray-400 mt-2">Bloomy Technologies</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-bloomy-600 to-blue-600 rounded-3xl p-8 text-white mb-6 text-center">
          <img src="/bloomy-logo.jpg" alt="Bloomy" className="w-14 h-14 rounded-2xl object-cover mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{survey?.title}</h1>
          {survey?.description && (
            <p className="text-white/70 text-sm leading-relaxed">
              {survey.description.replace(/^__cohort:[^_]+__/, '')}
            </p>
          )}
          {survey?.is_anonymous && (
            <span className="inline-block mt-3 text-xs bg-white/20 text-white px-3 py-1 rounded-full">
              🔒 Anonymous — your identity is not recorded
            </span>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 p-6">
              <p className="font-semibold text-gray-900 mb-1">
                <span className="text-bloomy-500 mr-2">{i + 1}.</span>
                {q.question}
                {q.required && <span className="text-red-400 ml-1">*</span>}
              </p>

              {/* Multiple Choice */}
              {q.type === 'multiple_choice' && (
                <div className="space-y-2 mt-3">
                  {(Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')).map((opt: string) => (
                    <label key={opt} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[q.id] === opt ? 'border-bloomy-500 bg-bloomy-50' : 'border-gray-100 hover:border-gray-200'
                    }`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        answers[q.id] === opt ? 'border-bloomy-500 bg-bloomy-500' : 'border-gray-300'
                      }`}>
                        {answers[q.id] === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className="text-sm text-gray-700">{opt}</span>
                      <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                        onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} className="sr-only" />
                    </label>
                  ))}
                </div>
              )}

              {/* Yes / No */}
              {q.type === 'yes_no' && (
                <div className="flex gap-3 mt-3">
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} type="button" onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                      className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        answers[q.id] === opt
                          ? opt === 'Yes' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {opt === 'Yes' ? '✓ Yes' : '✗ No'}
                    </button>
                  ))}
                </div>
              )}

              {/* Rating */}
              {q.type === 'rating' && (
                <div className="flex gap-2 mt-3">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setAnswers(a => ({ ...a, [q.id]: n }))}
                      className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all hover:border-yellow-400"
                      style={{ borderColor: answers[q.id] >= n ? '#f59e0b' : '#e5e7eb', background: answers[q.id] >= n ? '#fffbeb' : 'white' }}>
                      <Star className="w-5 h-5" fill={answers[q.id] >= n ? '#f59e0b' : 'none'} stroke={answers[q.id] >= n ? '#f59e0b' : '#9ca3af'} />
                      <span className="text-xs font-medium" style={{ color: answers[q.id] >= n ? '#92400e' : '#9ca3af' }}>{n}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Short Text */}
              {q.type === 'short_text' && (
                <input value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                  className={inp + ' mt-3'} placeholder="Your answer..." />
              )}

              {/* Long Text */}
              {q.type === 'long_text' && (
                <textarea value={answers[q.id] || ''} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                  rows={4} className={inp + ' mt-3 resize-none'} placeholder="Your answer..." />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Submit */}
        <button onClick={submit} disabled={submitting}
          className="mt-6 w-full btn-primary py-4 text-base font-semibold flex items-center justify-center gap-2 rounded-2xl">
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Submitting...</> : 'Submit Response'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">Powered by Bloomy Technologies LMS</p>
      </div>
    </div>
  )
}
