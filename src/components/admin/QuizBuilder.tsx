'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Loader2, CheckCircle, HelpCircle } from 'lucide-react'

interface Question {
  question: string
  type: 'multiple_choice' | 'true_false' | 'short_text'
  options: string[]
  correct_answer: string
  explanation: string
  points: number
}

interface Props {
  lessonId: string
  lessonTitle: string
  onClose: () => void
}

export default function QuizBuilder({ lessonId, lessonTitle, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [title, setTitle] = useState('Quiz')
  const [passingScore, setPassingScore] = useState(70)
  const [timeLimit, setTimeLimit] = useState('')
  const [attemptsAllowed, setAttemptsAllowed] = useState(3)
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', explanation: '', points: 1 }
  ])

  useEffect(() => {
    if (!lessonId) { setLoading(false); return }
    fetch(`/api/admin/quiz-builder?lesson_id=${lessonId}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setTitle(d.data.title || 'Quiz')
          setPassingScore(d.data.passing_score || 70)
          setTimeLimit(d.data.time_limit_minutes || '')
          setAttemptsAllowed(d.data.attempts_allowed || 3)
          if (d.data.questions?.length) {
            setQuestions(d.data.questions.map((q: any) => ({
              question: q.question || '',
              type: q.type || 'multiple_choice',
              options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : ['', '', '', '']),
              correct_answer: q.correct_answer || '',
              explanation: q.explanation || '',
              points: q.points || 1,
            })))
          }
        }
        setLoading(false)
      })
  }, [lessonId])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/admin/quiz-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: lessonId,
        title,
        passing_score: passingScore,
        time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
        attempts_allowed: attemptsAllowed,
        questions: questions.filter(q => q.question.trim()),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addQuestion() {
    setQuestions(q => [...q, { question: '', type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', explanation: '', points: 1 }])
  }

  function updateQ(i: number, k: keyof Question, v: any) {
    setQuestions(qs => qs.map((q, j) => j === i ? { ...q, [k]: v } : q))
  }

  function updateOption(qi: number, oi: number, v: string) {
    setQuestions(qs => qs.map((q, j) => j === qi ? { ...q, options: q.options.map((o, k) => k === oi ? v : o) } : q))
  }

  function removeQ(i: number) {
    setQuestions(qs => qs.filter((_, j) => j !== i))
  }

  function setCorrect(qi: number, value: string) {
    updateQ(qi, 'correct_answer', value)
  }

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500 mx-auto" /></div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl sm:rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-900">Quiz Builder</h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{lessonTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Saved!</span>}
            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5 py-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save Quiz
            </button>
            <button onClick={onClose} className="btn-secondary text-sm py-2">Done</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Quiz settings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quiz Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pass Score (%)</label>
              <input type="number" value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value))} className={inp} min={0} max={100} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Time Limit (mins)</label>
              <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} className={inp} placeholder="No limit" min={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Attempts</label>
              <input type="number" value={attemptsAllowed} onChange={e => setAttemptsAllowed(parseInt(e.target.value))} className={inp} min={1} />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Question header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="w-6 h-6 bg-bloomy-100 text-bloomy-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <select value={q.type} onChange={e => updateQ(i, 'type', e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                    <option value="short_text">Short Answer</option>
                  </select>
                  <div className="flex items-center gap-1 ml-auto">
                    <input type="number" value={q.points} onChange={e => updateQ(i, 'points', parseInt(e.target.value))}
                      className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center" min={1} />
                    <span className="text-xs text-gray-400">pts</span>
                  </div>
                  {questions.length > 1 && (
                    <button onClick={() => removeQ(i)} className="text-gray-300 hover:text-red-400 ml-2"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {/* Question text */}
                  <textarea value={q.question} onChange={e => updateQ(i, 'question', e.target.value)}
                    rows={2} className={inp + ' resize-none'} placeholder="Enter your question..." />

                  {/* Multiple choice options */}
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">Options — click radio to mark correct answer</p>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2.5">
                          <button onClick={() => setCorrect(i, opt)}
                            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                              q.correct_answer === opt && opt
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300 hover:border-green-400'
                            }`}>
                            {q.correct_answer === opt && opt && (
                              <span className="block w-2 h-2 bg-white rounded-full mx-auto" />
                            )}
                          </button>
                          <input value={opt} onChange={e => {
                            const wasCorrect = q.correct_answer === opt
                            updateOption(i, oi, e.target.value)
                            if (wasCorrect) updateQ(i, 'correct_answer', e.target.value)
                          }}
                            className={`flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400 ${
                              q.correct_answer === opt && opt ? 'border-green-300 bg-green-50' : 'border-gray-200'
                            }`}
                            placeholder={`Option ${oi + 1}`} />
                        </div>
                      ))}
                      {q.correct_answer && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Correct: "{q.correct_answer}"</p>}
                    </div>
                  )}

                  {/* True/False */}
                  {q.type === 'true_false' && (
                    <div className="flex gap-3">
                      {['True', 'False'].map(val => (
                        <button key={val} onClick={() => updateQ(i, 'correct_answer', val)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                            q.correct_answer === val
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}>
                          {val === 'True' ? '✓ True' : '✗ False'}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Short answer */}
                  {q.type === 'short_text' && (
                    <input value={q.correct_answer} onChange={e => updateQ(i, 'correct_answer', e.target.value)}
                      className={inp} placeholder="Expected answer (for manual grading reference)..." />
                  )}

                  {/* Explanation */}
                  <input value={q.explanation} onChange={e => updateQ(i, 'explanation', e.target.value)}
                    className={inp} placeholder="Explanation shown after submission (optional)..." />
                </div>
              </div>
            ))}
          </div>

          <button onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />Add Question
          </button>
        </div>
      </div>
    </div>
  )
}
