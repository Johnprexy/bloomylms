'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2, Save, CheckCircle, AlertCircle } from 'lucide-react'

interface Question {
  id?: string
  question: string
  type: 'multiple_choice' | 'true_false' | 'short_answer'
  options: string[]
  correct_answer: string
  explanation: string
  points: number
}

interface Props {
  lessonId: string
  courseId: string
  lessonTitle: string
  onClose: () => void
}

export default function QuizBuilder({ lessonId, courseId, lessonTitle, onClose }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [quizMeta, setQuizMeta] = useState({ title: '', passing_score: 70, time_limit_minutes: '', attempts_allowed: 3 })
  const [questions, setQuestions] = useState<Question[]>([])

  useEffect(() => {
    fetch(`/api/admin/quiz-builder?lesson_id=${lessonId}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setQuizMeta({
            title: d.data.title || '',
            passing_score: d.data.passing_score || 70,
            time_limit_minutes: d.data.time_limit_minutes || '',
            attempts_allowed: d.data.attempts_allowed || 3,
          })
          setQuestions(d.data.questions?.map((q: any) => ({
            ...q,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || ['', '', '', '']),
          })) || [])
        }
        setLoading(false)
      })
  }, [lessonId])

  async function saveQuiz() {
    setSaving(true)
    setSaved(false)
    await fetch('/api/admin/quiz-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: lessonId,
        course_id: courseId,
        title: quizMeta.title || `Quiz: ${lessonTitle}`,
        passing_score: quizMeta.passing_score,
        time_limit_minutes: quizMeta.time_limit_minutes || null,
        attempts_allowed: quizMeta.attempts_allowed,
        questions,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function addQuestion() {
    setQuestions(q => [...q, { question: '', type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', explanation: '', points: 1 }])
  }

  function updateQ(i: number, k: keyof Question, v: any) {
    setQuestions(q => q.map((x, j) => j === i ? { ...x, [k]: v } : x))
  }

  function updateOption(qi: number, oi: number, v: string) {
    setQuestions(q => q.map((x, j) => j === qi ? { ...x, options: x.options.map((o, k) => k === oi ? v : o) } : x))
  }

  function addOption(qi: number) {
    setQuestions(q => q.map((x, j) => j === qi ? { ...x, options: [...x.options, ''] } : x))
  }

  function removeOption(qi: number, oi: number) {
    setQuestions(q => q.map((x, j) => j === qi ? { ...x, options: x.options.filter((_, k) => k !== oi) } : x))
  }

  function removeQ(i: number) {
    setQuestions(q => q.filter((_, j) => j !== i))
  }

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500 mx-auto" /></div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900">Quiz Builder</h2>
            <p className="text-xs text-gray-400 mt-0.5">{lessonTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Saved!</span>}
            <button onClick={saveQuiz} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5 py-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Quiz
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 text-xl leading-none">&times;</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quiz settings */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Quiz title</label>
              <input value={quizMeta.title} onChange={e => setQuizMeta(m => ({ ...m, title: e.target.value }))}
                className={inp} placeholder={`Quiz: ${lessonTitle}`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pass score %</label>
              <input type="number" value={quizMeta.passing_score} min={0} max={100}
                onChange={e => setQuizMeta(m => ({ ...m, passing_score: parseInt(e.target.value) || 70 }))}
                className={inp} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Attempts</label>
              <input type="number" value={quizMeta.attempts_allowed} min={1}
                onChange={e => setQuizMeta(m => ({ ...m, attempts_allowed: parseInt(e.target.value) || 3 }))}
                className={inp} />
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Question header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                <span className="w-7 h-7 bg-bloomy-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <select value={q.type} onChange={e => updateQ(i, 'type', e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
                <input type="number" value={q.points} min={1} onChange={e => updateQ(i, 'points', parseInt(e.target.value) || 1)}
                  className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white" placeholder="pts" />
                <button onClick={() => removeQ(i)} className="ml-auto text-gray-300 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                {/* Question text */}
                <input value={q.question} onChange={e => updateQ(i, 'question', e.target.value)}
                  className={inp} placeholder="Question text..." />

                {/* Options */}
                {q.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">Answer choices — click the circle to mark the correct answer</p>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          onClick={() => updateQ(i, 'correct_answer', opt)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            q.correct_answer === opt && opt
                              ? 'border-green-500 bg-green-500'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                          title="Mark as correct answer">
                          {q.correct_answer === opt && opt && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <input value={opt} onChange={e => { updateOption(i, oi, e.target.value); if (q.correct_answer === opt) updateQ(i, 'correct_answer', e.target.value) }}
                          className={`flex-1 text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400 ${q.correct_answer === opt && opt ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                          placeholder={`Option ${oi + 1}`} />
                        {q.options.length > 2 && (
                          <button onClick={() => removeOption(i, oi)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addOption(i)} className="text-xs text-bloomy-600 flex items-center gap-1 hover:text-bloomy-700">
                      <Plus className="w-3 h-3" />Add option
                    </button>
                    {!q.correct_answer && <p className="text-xs text-orange-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Click a circle to set the correct answer</p>}
                  </div>
                )}

                {q.type === 'true_false' && (
                  <div className="flex gap-3">
                    {['True', 'False'].map(opt => (
                      <button key={opt} onClick={() => updateQ(i, 'correct_answer', opt)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                          q.correct_answer === opt ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Expected answer (for auto-grading)</p>
                    <input value={q.correct_answer} onChange={e => updateQ(i, 'correct_answer', e.target.value)}
                      className={inp} placeholder="Expected answer..." />
                  </div>
                )}

                {/* Explanation */}
                <input value={q.explanation} onChange={e => updateQ(i, 'explanation', e.target.value)}
                  className={inp + ' text-xs'} placeholder="Explanation (shown after answering) — optional" />
              </div>
            </div>
          ))}

          <button onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />Add Question
          </button>
        </div>
      </div>
    </div>
  )
}
