'use client'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, AlertCircle, User, BookOpen, Clock, ArrowLeft, Save } from 'lucide-react'

export default function GradingPage() {
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [attemptDetail, setAttemptDetail] = useState<any>(null)
  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string }>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadQueue() }, [])

  async function loadQueue() {
    const d = await fetch('/api/v2/grading').then(r => r.json())
    setQueue(d.data || [])
    setLoading(false)
  }

  async function openAttempt(attempt: any) {
    setSelected(attempt)
    setGrades({})
    const d = await fetch(`/api/v2/attempts/${attempt.attempt_id}/grade`).then(r => r.json())
    setAttemptDetail(d.data)
    // Pre-fill any existing grades
    if (d.data?.answers) {
      const g: Record<string, { score: string; feedback: string }> = {}
      d.data.answers.forEach((a: any) => {
        if (a.manual_score !== null && a.manual_score !== undefined) {
          g[a.question_id] = { score: String(a.manual_score), feedback: a.instructor_feedback || '' }
        }
      })
      setGrades(g)
    }
  }

  async function submitGrades() {
    if (!selected) return
    setSaving(true)
    const gradeArray = Object.entries(grades).map(([qid, g]) => ({
      question_id: qid, score: parseFloat(g.score) || 0, feedback: g.feedback
    }))
    const res = await fetch(`/api/v2/attempts/${selected.attempt_id}/grade`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grades: gradeArray })
    }).then(r => r.json())
    setSaving(false)
    if (res.data) {
      setSaved(true)
      setQueue(prev => prev.filter(a => a.attempt_id !== selected.attempt_id))
      setTimeout(() => { setSaved(false); setSelected(null); setAttemptDetail(null) }, 2000)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  // Grading view
  if (selected && attemptDetail) {
    const manualAnswers = attemptDetail.answers?.filter((a: any) => a.requires_manual_grading)
    const totalManualPoints = manualAnswers?.reduce((s: number, a: any) => s + parseFloat(a.points || 1), 0) || 0
    const gradedPoints = Object.values(grades).reduce((s: number, g: any) => s + (parseFloat(g.score) || 0), 0)
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelected(null); setAttemptDetail(null) }} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grade Submission</h1>
            <p className="text-sm text-gray-500">{selected.student_name} · {selected.quiz_title}</p>
          </div>
        </div>

        {/* Student info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div><p className="text-xs text-gray-400 font-medium uppercase mb-1">Student</p><p className="font-semibold text-gray-900">{selected.student_name}</p><p className="text-gray-500">{selected.student_email}</p></div>
            <div><p className="text-xs text-gray-400 font-medium uppercase mb-1">Quiz</p><p className="font-semibold text-gray-900">{selected.quiz_title}</p><p className="text-gray-500">{selected.course_title}</p></div>
            <div><p className="text-xs text-gray-400 font-medium uppercase mb-1">Auto-graded Score</p>
              <p className="text-2xl font-bold text-bloomy-600">{Math.round(attemptDetail.attempt?.auto_score || 0)}%</p>
              <p className="text-xs text-gray-400">Attempt #{attemptDetail.attempt?.attempt_number} · {selected.submitted_at ? new Date(selected.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}</p>
            </div>
          </div>
        </div>

        {/* Questions to grade */}
        {manualAnswers?.map((a: any) => (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 bg-orange-50 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-800">{a.question_type === 'essay' ? 'Essay' : 'File Upload'} — Manual Grading Required</span>
                </div>
                <span className="text-xs text-orange-600">Max {a.points} pts</span>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Question</p>
                <p className="text-sm text-gray-900 font-medium">{a.question_text}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Student's Answer</p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                  {(() => { try { const ans = typeof a.answer === 'string' ? JSON.parse(a.answer) : a.answer; return typeof ans === 'string' ? ans : JSON.stringify(ans, null, 2) } catch { return a.answer || '(No answer)' } })()}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Score (out of {a.points})</label>
                  <input type="number" min={0} max={a.points} step={0.5}
                    value={grades[a.question_id]?.score ?? ''}
                    onChange={e => setGrades(g => ({ ...g, [a.question_id]: { ...g[a.question_id], score: e.target.value, feedback: g[a.question_id]?.feedback || '' } }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500"
                    placeholder="Enter score..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Feedback (shown to student)</label>
                  <textarea value={grades[a.question_id]?.feedback || ''}
                    onChange={e => setGrades(g => ({ ...g, [a.question_id]: { ...g[a.question_id], feedback: e.target.value, score: g[a.question_id]?.score || '' } }))}
                    rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 resize-none"
                    placeholder="Optional feedback..." />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Submit */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Manual points graded: <span className="font-bold text-gray-900">{gradedPoints.toFixed(1)}</span> / {totalManualPoints}
          </div>
          <button onClick={submitGrades} disabled={saving || saved}
            className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all ${saved ? 'bg-green-600 text-white' : 'btn-primary'} disabled:opacity-70`}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : saved ? <><CheckCircle className="w-4 h-4" />Grades Submitted!</> : <><Save className="w-4 h-4" />Submit Grades</>}
          </button>
        </div>
      </div>
    )
  }

  // Queue list
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grading Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Essay and file upload answers waiting for manual grading</p>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="font-medium text-gray-600">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No submissions waiting for grading</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-orange-50 border-b border-orange-100">
            <p className="text-sm font-semibold text-orange-800">{queue.length} submission{queue.length !== 1 ? 's' : ''} awaiting grading</p>
          </div>
          <div className="divide-y divide-gray-50">
            {queue.map(item => (
              <div key={item.attempt_id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                <div className="w-10 h-10 bg-bloomy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-bloomy-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{item.student_name}</p>
                  <p className="text-xs text-gray-400">{item.student_email}</p>
                </div>
                <div className="hidden sm:block flex-1 min-w-0">
                  <p className="text-sm text-gray-700 font-medium truncate">{item.quiz_title}</p>
                  <p className="text-xs text-gray-400">{item.course_title}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">{item.submitted_at ? new Date(item.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Auto: {Math.round(item.auto_score || 0)}%</p>
                </div>
                <button onClick={() => openAttempt(item)} className="btn-primary text-sm px-4 py-2 flex-shrink-0">Grade</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
