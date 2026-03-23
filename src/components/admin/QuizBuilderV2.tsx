'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Save, Loader2, CheckCircle, X, ChevronDown, ChevronUp,
  Settings, BarChart2, HelpCircle, Copy, GripVertical, Eye, AlertCircle,
  Clock, Target, Shuffle, BookOpen, ArrowLeft } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
type QType = 'mcq'|'multi_select'|'true_false'|'short_answer'|'essay'|'matching'|'ordering'|'file_upload'
interface Option { id?: string; text: string; is_correct: boolean; match_text?: string; position?: number }
interface Question {
  id?: string; type: QType; text: string; points: number; difficulty: string
  hint_text?: string; hint_penalty?: number; explanation?: string; topic_tags?: string[]
  word_limit?: number; accepted_files?: string[]; case_sensitive?: boolean; partial_credit?: boolean
  options: Option[]; position: number
}
interface QuizSettings {
  title: string; description: string; instructions: string
  time_limit_minutes: string; passing_score: number; max_attempts: number
  cooldown_minutes: number; grading_method: string
  shuffle_questions: boolean; shuffle_options: boolean
  show_results_immediately: boolean; show_correct_answers: string; show_explanations: boolean
  available_from: string; available_until: string; require_previous_lesson: boolean
  status: string
}
interface Props {
  quizId?: string; lessonId?: string; courseId?: string; lessonTitle?: string
  onClose?: () => void
  onSaved?: (data: { quiz_id: string; title: string; question_count: number }) => void
}

// ─── Constants ───────────────────────────────────────────────────────────────
const Q_TYPES: { value: QType; label: string; icon: string; desc: string; manual?: boolean }[] = [
  { value: 'mcq', label: 'Multiple Choice', icon: '◉', desc: 'One correct answer' },
  { value: 'multi_select', label: 'Multiple Select', icon: '☑', desc: 'Multiple correct answers' },
  { value: 'true_false', label: 'True / False', icon: '⇄', desc: 'Boolean answer' },
  { value: 'short_answer', label: 'Short Answer', icon: '✏', desc: 'Text, auto-graded' },
  { value: 'essay', label: 'Essay', icon: '📝', desc: 'Long answer, manual grading', manual: true },
  { value: 'matching', label: 'Matching', icon: '⇌', desc: 'Match pairs' },
  { value: 'ordering', label: 'Ordering', icon: '↕', desc: 'Arrange in order' },
  { value: 'file_upload', label: 'File Upload', icon: '📎', desc: 'Upload file, manual grading', manual: true },
]

const defaultQuestion = (pos: number): Question => ({
  type: 'mcq', text: '', points: 1, difficulty: 'medium',
  options: [{ text: '', is_correct: false }, { text: '', is_correct: false },
             { text: '', is_correct: false }, { text: '', is_correct: false }],
  position: pos
})

const defaultSettings: QuizSettings = {
  title: '', description: '', instructions: '',
  time_limit_minutes: '', passing_score: 70, max_attempts: 3,
  cooldown_minutes: 0, grading_method: 'highest',
  shuffle_questions: false, shuffle_options: false,
  show_results_immediately: true, show_correct_answers: 'immediately', show_explanations: true,
  available_from: '', available_until: '', require_previous_lesson: false, status: 'draft'
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuizBuilderV2({ quizId: initialQuizId, lessonId, courseId, lessonTitle, onClose, onSaved }: Props) {
  const [activeTab, setActiveTab] = useState<'questions'|'settings'|'analytics'>('questions')
  const [settings, setSettings] = useState<QuizSettings>(defaultSettings)
  const [questions, setQuestions] = useState<Question[]>([defaultQuestion(0)])
  const [expandedQ, setExpandedQ] = useState<Set<number>>(new Set([0]))
  const [loading, setLoading] = useState(!!initialQuizId)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')
  const [error, setError] = useState('')
  const [quizId, setQuizId] = useState(initialQuizId || '')
  const [analytics, setAnalytics] = useState<any>(null)
  const [preview, setPreview] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Load existing quiz
  useEffect(() => {
    if (!initialQuizId) { setLoading(false); return }
    fetch(`/api/v2/quizzes/${initialQuizId}`)
      .then(r => r.json()).then(d => {
        if (!d.data) { setLoading(false); return }
        const q = d.data
        setSettings({
          title: q.title || '', description: q.description || '', instructions: q.instructions || '',
          time_limit_minutes: q.time_limit_minutes || '', passing_score: q.passing_score || 70,
          max_attempts: q.max_attempts || 3, cooldown_minutes: q.cooldown_minutes || 0,
          grading_method: q.grading_method || 'highest',
          shuffle_questions: q.shuffle_questions || false, shuffle_options: q.shuffle_options || false,
          show_results_immediately: q.show_results_immediately ?? true,
          show_correct_answers: q.show_correct_answers || 'immediately',
          show_explanations: q.show_explanations ?? true,
          available_from: q.available_from ? q.available_from.slice(0,16) : '',
          available_until: q.available_until ? q.available_until.slice(0,16) : '',
          require_previous_lesson: q.require_previous_lesson || false,
          status: q.status || 'draft'
        })
        if (d.data.questions?.length) {
          setQuestions(d.data.questions.map((q: any, i: number) => ({
            id: q.id, type: q.type, text: q.text || '', points: q.points || 1,
            difficulty: q.difficulty || 'medium', hint_text: q.hint_text || '',
            explanation: q.explanation || '', topic_tags: q.topic_tags || [],
            word_limit: q.word_limit, accepted_files: q.accepted_files || [],
            case_sensitive: q.case_sensitive || false, partial_credit: q.partial_credit || false,
            options: (q.options || []).map((o: any) => ({ id: o.id, text: o.text, is_correct: o.is_correct, match_text: o.match_text || '', position: o.position })),
            position: i
          })))
          setExpandedQ(new Set([0]))
        }
        setLoading(false)
      })
  }, [initialQuizId])

  // Auto-save every 30s
  useEffect(() => {
    if (!dirty || !quizId) return
    const t = setTimeout(() => { if (quizId) handleSave(true) }, 30000)
    return () => clearTimeout(t)
  }, [dirty, quizId])

  async function handleSave(silent = false) {
    if (!settings.title.trim()) { setError('Quiz title is required'); setActiveTab('settings'); return }
    if (!silent) setSaving(true)
    setSaveStatus('saving')
    try {
      let qid = quizId
      // Create or update quiz settings
      const settingsBody = {
        ...settings, lesson_id: lessonId, course_id: courseId,
        time_limit_minutes: settings.time_limit_minutes ? parseInt(settings.time_limit_minutes) : null,
        available_from: settings.available_from || null,
        available_until: settings.available_until || null,
      }
      if (!qid) {
        const res = await fetch('/api/v2/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsBody) }).then(r => r.json())
        if (res.error) throw new Error(res.error)
        qid = res.data.id
        setQuizId(qid)
      } else {
        const res = await fetch(`/api/v2/quizzes/${qid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsBody) }).then(r => r.json())
        if (res.error) throw new Error(res.error)
      }
      // Save questions
      const validQs = questions.filter(q => q.text.trim())
      const res = await fetch(`/api/v2/quizzes/${qid}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questions: validQs }) }).then(r => r.json())
      if (res.error) throw new Error(res.error)
      setSaveStatus('saved')
      setDirty(false)
      onSaved?.({ quiz_id: qid, title: settings.title, question_count: validQs.length })
      if (!silent) setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (e: any) {
      setError(e.message || 'Save failed')
      setSaveStatus('error')
    }
    if (!silent) setSaving(false)
  }

  async function loadAnalytics() {
    if (!quizId) return
    const d = await fetch(`/api/v2/quizzes/${quizId}/analytics`).then(r => r.json())
    setAnalytics(d.data)
  }

  function updSettings(k: keyof QuizSettings, v: any) { setSettings(s => ({ ...s, [k]: v })); setDirty(true) }
  function updQ(i: number, k: keyof Question, v: any) { setQuestions(qs => qs.map((q, j) => j === i ? { ...q, [k]: v } : q)); setDirty(true) }
  function updOpt(qi: number, oi: number, k: keyof Option, v: any) {
    setQuestions(qs => qs.map((q, j) => j === qi ? { ...q, options: q.options.map((o, k2) => k2 === oi ? { ...o, [k]: v } : o) } : q))
    setDirty(true)
  }
  function addQ() { const i = questions.length; setQuestions(q => [...q, defaultQuestion(i)]); setExpandedQ(s => new Set([...s, i])); setDirty(true) }
  function dupQ(i: number) { const q = { ...questions[i], id: undefined, position: questions.length }; setQuestions(qs => [...qs, q]); setDirty(true) }
  function removeQ(i: number) { if (!confirm('Delete this question?')) return; setQuestions(qs => qs.filter((_, j) => j !== i).map((q, j) => ({ ...q, position: j }))); setDirty(true) }
  function addOpt(qi: number) { updQ(qi, 'options', [...questions[qi].options, { text: '', is_correct: false }]) }
  function removeOpt(qi: number, oi: number) { const opts = questions[qi].options.filter((_, j) => j !== oi); updQ(qi, 'options', opts) }

  const totalPoints = questions.filter(q => q.text.trim()).reduce((s, q) => s + (q.points || 1), 0)
  const validCount = questions.filter(q => q.text.trim()).length
  const hasManual = questions.some(q => ['essay','file_upload'].includes(q.type))
  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white'
  const isModal = !!onClose

  if (loading) return (
    <div className={isModal ? "fixed inset-0 bg-black/60 z-50 flex items-center justify-center" : "flex items-center justify-center h-64"}>
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-bloomy-500" />
        <p className="text-sm text-gray-500">Loading quiz...</p>
      </div>
    </div>
  )

  const content = (
    <div className={isModal ? "bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-5xl flex flex-col shadow-2xl" : "flex flex-col"} style={{ maxHeight: isModal ? '96vh' : '100%' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white rounded-t-2xl">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!isModal && onClose && <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></button>}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <HelpCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <h2 className="font-bold text-gray-900 text-lg truncate">{settings.title || 'Untitled Quiz'}</h2>
              {settings.status === 'published' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Published</span>}
              {settings.status === 'draft' && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Draft</span>}
              {quizId && hasManual && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Has manual grading</span>}
            </div>
            {lessonTitle && <p className="text-xs text-gray-400 mt-0.5 truncate">Lesson: {lessonTitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {error && <div className="flex items-center gap-1.5 bg-red-50 text-red-700 text-xs px-3 py-1.5 rounded-lg border border-red-100 max-w-56">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{error}</span>
            <button onClick={() => setError('')} className="flex-shrink-0">✕</button>
          </div>}
          {saveStatus === 'saved' && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />Saved</span>}
          {saveStatus === 'saving' && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</span>}
          {dirty && saveStatus === 'idle' && <span className="text-xs text-orange-500">Unsaved changes</span>}
          <button onClick={() => setPreview(!preview)} className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 ${preview ? 'bg-bloomy-100 border-bloomy-300 text-bloomy-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            <Eye className="w-3.5 h-3.5" />{preview ? 'Edit Mode' : 'Preview'}
          </button>
          {settings.status === 'draft' && quizId && (
            <button onClick={() => { updSettings('status', 'published'); setTimeout(() => handleSave(), 100) }}
              className="text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 font-medium">Publish</button>
          )}
          <button onClick={() => handleSave()} disabled={saving}
            className={`text-sm flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold transition-all ${saveStatus === 'saved' ? 'bg-green-600 text-white' : 'btn-primary'}`}>
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : saveStatus === 'saved' ? <><CheckCircle className="w-3.5 h-3.5" />Saved ✓</> : <><Save className="w-3.5 h-3.5" />Save Quiz</>}
          </button>
          {isModal && <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-100 flex-shrink-0 px-6 bg-white">
        {[
          { id: 'questions', label: `Questions (${validCount})`, icon: HelpCircle },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'analytics', label: 'Analytics', icon: BarChart2 },
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id as any); if (t.id === 'analytics') loadAnalytics() }}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-3 border-b-2 transition-colors ${activeTab === t.id ? 'border-bloomy-500 text-bloomy-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3 py-2 text-xs text-gray-400">
          <span>{validCount} question{validCount !== 1 ? 's' : ''}</span>
          <span>·</span><span>{totalPoints} pts</span>
          <span>·</span><span>Pass: {settings.passing_score}%</span>
          {settings.time_limit_minutes && <><span>·</span><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{settings.time_limit_minutes}m</span></>}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* QUESTIONS TAB */}
        {activeTab === 'questions' && !preview && (
          <div className="p-6 space-y-3">
            {questions.map((q, i) => {
              const isOpen = expandedQ.has(i)
              const typeInfo = Q_TYPES.find(t => t.value === q.type) || Q_TYPES[0]
              const hasAnswer = ['essay','file_upload'].includes(q.type) || q.type === 'multi_select' ? true : q.options.some(o => o.is_correct) || (q.type === 'short_answer' && q.options.some(o => o.text))
              
              return (
                <div key={i} className={`border-2 rounded-2xl overflow-hidden transition-all ${hasAnswer && q.text ? 'border-gray-100' : q.text ? 'border-orange-200' : 'border-dashed border-gray-200'}`}>
                  {/* Question header */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer" onClick={() => setExpandedQ(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })}>
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${hasAnswer && q.text ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {hasAnswer && q.text ? '✓' : i + 1}
                    </span>
                    <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500 flex-shrink-0">{typeInfo.icon} {typeInfo.label}</span>
                    <p className="flex-1 text-sm text-gray-800 truncate min-w-0">{q.text || <span className="text-gray-400 italic">Empty question — click to edit</span>}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${q.difficulty === 'easy' ? 'bg-green-50 text-green-600' : q.difficulty === 'hard' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{q.difficulty}</span>
                      <span className="text-xs text-gray-400">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                      {typeInfo.manual && <span className="text-xs text-orange-500">manual</span>}
                      {!hasAnswer && q.text && <span className="text-xs text-orange-500 hidden sm:block">no answer</span>}
                      <button onClick={e => { e.stopPropagation(); dupQ(i) }} className="text-gray-300 hover:text-bloomy-500 p-0.5" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                      {questions.length > 1 && <button onClick={e => { e.stopPropagation(); removeQ(i) }} className="text-gray-300 hover:text-red-400 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>}
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-5 space-y-4 bg-white">
                      {/* Type selector */}
                      <div className="flex flex-wrap gap-1.5">
                        {Q_TYPES.map(t => (
                          <button key={t.value} onClick={() => { updQ(i, 'type', t.value); if (t.value === 'true_false') updQ(i, 'options', [{ text: 'True', is_correct: false }, { text: 'False', is_correct: false }]) }}
                            title={t.desc}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${q.type === t.value ? 'bg-bloomy-600 text-white border-bloomy-600' : 'bg-white text-gray-600 border-gray-200 hover:border-bloomy-300'}`}>
                            {t.icon} {t.label}
                          </button>
                        ))}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-48">
                          <label className="text-xs font-medium text-gray-500 block mb-1">Points</label>
                          <input type="number" value={q.points} onChange={e => updQ(i, 'points', parseFloat(e.target.value)||1)} className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-bloomy-500" min={0.5} step={0.5} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Difficulty</label>
                          <select value={q.difficulty} onChange={e => updQ(i, 'difficulty', e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white">
                            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                          </select>
                        </div>
                        {['essay','file_upload'].includes(q.type) && (
                          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-3.5 h-3.5" />Requires manual grading
                          </div>
                        )}
                      </div>

                      {/* Question text */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Question *</label>
                        <textarea value={q.text} onChange={e => updQ(i, 'text', e.target.value)} rows={2} className={inp + ' resize-none'} placeholder="Type your question here..." />
                      </div>

                      {/* MCQ options */}
                      {(q.type === 'mcq' || q.type === 'true_false') && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-2">Answer Options — <span className="text-green-600">click ○ to mark correct answer</span></label>
                          <div className="space-y-2">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2.5">
                                <button onClick={() => { const newOpts = q.options.map((o, k) => ({ ...o, is_correct: k === oi && !!opt.text })); updQ(i, 'options', newOpts) }}
                                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${opt.is_correct && opt.text ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-bloomy-400'}`}>
                                  {opt.is_correct && opt.text && <div className="w-2 h-2 bg-white rounded-full" />}
                                </button>
                                <input value={opt.text} onChange={e => updOpt(i, oi, 'text', e.target.value)}
                                  disabled={q.type === 'true_false'}
                                  className={`flex-1 text-sm px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-bloomy-400 ${opt.is_correct && opt.text ? 'border-green-400 bg-green-50 font-medium' : 'border-gray-200'} disabled:bg-gray-50 disabled:text-gray-500`}
                                  placeholder={`Option ${oi + 1}`} />
                                {q.type !== 'true_false' && q.options.length > 2 && (
                                  <button onClick={() => removeOpt(i, oi)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                                )}
                              </div>
                            ))}
                          </div>
                          {q.type !== 'true_false' && (
                            <div className="flex items-center gap-4 mt-2">
                              <button onClick={() => addOpt(i)} className="text-xs text-bloomy-600 flex items-center gap-1 hover:text-bloomy-700"><Plus className="w-3 h-3" />Add option</button>
                              {q.options.some(o => o.is_correct) && <span className="text-xs text-green-600">✓ {q.options.find(o => o.is_correct)?.text}</span>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Multi select */}
                      {q.type === 'multi_select' && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-2">Options — <span className="text-green-600">check ALL correct answers</span></label>
                          <div className="space-y-2">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2.5">
                                <button onClick={() => updOpt(i, oi, 'is_correct', !opt.is_correct)}
                                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${opt.is_correct && opt.text ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-bloomy-400'}`}>
                                  {opt.is_correct && opt.text && <CheckCircle className="w-3 h-3 text-white" />}
                                </button>
                                <input value={opt.text} onChange={e => updOpt(i, oi, 'text', e.target.value)} className={`flex-1 text-sm px-3 py-1.5 border rounded-xl focus:outline-none focus:ring-1 focus:ring-bloomy-400 ${opt.is_correct && opt.text ? 'border-green-400 bg-green-50' : 'border-gray-200'}`} placeholder={`Option ${oi + 1}`} />
                                {q.options.length > 2 && <button onClick={() => removeOpt(i, oi)} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <button onClick={() => addOpt(i)} className="text-xs text-bloomy-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add option</button>
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                              <input type="checkbox" checked={q.partial_credit||false} onChange={e => updQ(i, 'partial_credit', e.target.checked)} className="accent-bloomy-600" />Partial credit
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Short answer */}
                      {q.type === 'short_answer' && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-2">Accepted Answers — <span className="text-gray-400">add multiple variants</span></label>
                          <div className="space-y-2">
                            {(q.options.length ? q.options : [{ text: '', is_correct: true }]).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input value={opt.text} onChange={e => updOpt(i, oi, 'text', e.target.value)} className={inp + ' flex-1'} placeholder={`Accepted answer ${oi + 1}`} />
                                {q.options.length > 1 && <button onClick={() => removeOpt(i, oi)} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <button onClick={() => addOpt(i)} className="text-xs text-bloomy-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add variant</button>
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                              <input type="checkbox" checked={q.case_sensitive||false} onChange={e => updQ(i, 'case_sensitive', e.target.checked)} className="accent-bloomy-600" />Case sensitive
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Essay */}
                      {q.type === 'essay' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-100 px-3 py-2 rounded-xl">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />Essay questions are manually graded by the instructor
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Word Limit (optional)</label>
                            <input type="number" value={q.word_limit||''} onChange={e => updQ(i, 'word_limit', parseInt(e.target.value)||undefined)} className={inp} placeholder="No limit" min={10} />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Model Answer / Rubric (for instructor reference)</label>
                            <textarea value={q.explanation||''} onChange={e => updQ(i, 'explanation', e.target.value)} rows={3} className={inp + ' resize-none'} placeholder="Describe what a good answer looks like..." />
                          </div>
                        </div>
                      )}

                      {/* Matching */}
                      {q.type === 'matching' && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-2">Matching Pairs — <span className="text-gray-400">left → right</span></label>
                          <div className="space-y-2">
                            {(q.options.length ? q.options : [{ text: '', is_correct: true, match_text: '' }]).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input value={opt.text} onChange={e => updOpt(i, oi, 'text', e.target.value)} className={inp + ' flex-1'} placeholder={`Prompt ${oi + 1}`} />
                                <span className="text-gray-400 text-sm flex-shrink-0">→</span>
                                <input value={opt.match_text||''} onChange={e => updOpt(i, oi, 'match_text', e.target.value)} className={inp + ' flex-1'} placeholder={`Answer ${oi + 1}`} />
                                {q.options.length > 2 && <button onClick={() => removeOpt(i, oi)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <button onClick={() => addOpt(i)} className="text-xs text-bloomy-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add pair</button>
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                              <input type="checkbox" checked={q.partial_credit||false} onChange={e => updQ(i, 'partial_credit', e.target.checked)} className="accent-bloomy-600" />Partial credit per pair
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Ordering */}
                      {q.type === 'ordering' && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-2">Items in Correct Order — <span className="text-gray-400">students will rearrange these</span></label>
                          <div className="space-y-2">
                            {(q.options.length ? q.options : [{ text: '', is_correct: true }]).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-bloomy-100 text-bloomy-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{oi+1}</span>
                                <input value={opt.text} onChange={e => updOpt(i, oi, 'text', e.target.value)} className={inp + ' flex-1'} placeholder={`Step / item ${oi + 1}`} />
                                {q.options.length > 2 && <button onClick={() => removeOpt(i, oi)} className="text-gray-300 hover:text-red-400 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>}
                              </div>
                            ))}
                          </div>
                          <button onClick={() => addOpt(i)} className="mt-2 text-xs text-bloomy-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add item</button>
                        </div>
                      )}

                      {/* File Upload */}
                      {q.type === 'file_upload' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 border border-orange-100 px-3 py-2 rounded-xl">
                            <AlertCircle className="w-3.5 h-3.5" />File upload questions are manually graded
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Accepted File Types</label>
                            <div className="flex flex-wrap gap-2">
                              {['pdf','docx','xlsx','pptx','jpg','png','zip'].map(ext => (
                                <label key={ext} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                  <input type="checkbox" checked={(q.accepted_files||[]).includes(ext)}
                                    onChange={e => { const cur = q.accepted_files||[]; updQ(i, 'accepted_files', e.target.checked ? [...cur, ext] : cur.filter((f: string) => f !== ext)) }}
                                    className="accent-bloomy-600" />{ext.toUpperCase()}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Grading Instructions (for instructor)</label>
                            <textarea value={q.explanation||''} onChange={e => updQ(i, 'explanation', e.target.value)} rows={2} className={inp + ' resize-none'} placeholder="What to look for when grading..." />
                          </div>
                        </div>
                      )}

                      {/* Explanation (all types) */}
                      {!['essay','file_upload'].includes(q.type) && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Explanation <span className="text-gray-400">(shown after submission if enabled)</span></label>
                          <input value={q.explanation||''} onChange={e => updQ(i, 'explanation', e.target.value)} className={inp} placeholder="Why is this the correct answer? (optional)" />
                        </div>
                      )}

                      {/* Hint */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 block mb-1">Hint text <span className="text-gray-400">(optional)</span></label>
                          <input value={q.hint_text||''} onChange={e => updQ(i, 'hint_text', e.target.value)} className={inp} placeholder="Hint shown on request..." />
                        </div>
                        {q.hint_text && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 block mb-1">Hint penalty (pts deducted)</label>
                            <input type="number" value={q.hint_penalty||0} onChange={e => updQ(i, 'hint_penalty' as any, parseFloat(e.target.value)||0)} className={inp} min={0} step={0.5} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <button onClick={addQ} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:text-bloomy-600 hover:border-bloomy-200 flex items-center justify-center gap-2 transition-all">
              <Plus className="w-4 h-4" />Add Question
            </button>
          </div>
        )}

        {/* PREVIEW TAB */}
        {activeTab === 'questions' && preview && (
          <div className="p-6 space-y-4">
            <div className="bg-gradient-to-br from-bloomy-600 to-blue-600 text-white rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-1">{settings.title}</h3>
              {settings.instructions && <p className="text-white/80 text-sm">{settings.instructions}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm text-white/70">
                <span>{validCount} questions</span>
                {settings.time_limit_minutes && <span><Clock className="w-3.5 h-3.5 inline mr-1" />{settings.time_limit_minutes} minutes</span>}
                <span><Target className="w-3.5 h-3.5 inline mr-1" />Pass at {settings.passing_score}%</span>
                <span>{settings.max_attempts} attempt{settings.max_attempts !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {questions.filter(q => q.text).map((q, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="font-semibold text-gray-900 mb-4"><span className="text-bloomy-500 mr-2">{i+1}.</span>{q.text} <span className="text-gray-400 text-sm font-normal">({q.points} pt{q.points !== 1 ? 's' : ''})</span></p>
                {q.type === 'mcq' && q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-3 py-2 px-3 rounded-xl border border-gray-100 mb-2 cursor-pointer hover:bg-gray-50">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    <span className="text-sm">{o.text || `Option ${oi+1}`}</span>
                  </div>
                ))}
                {q.type === 'true_false' && (
                  <div className="flex gap-3">
                    {['True','False'].map(v => <button key={v} className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-300">{v === 'True' ? '✓ True' : '✗ False'}</button>)}
                  </div>
                )}
                {q.type === 'short_answer' && <input disabled className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50" placeholder="Student types answer here..." />}
                {q.type === 'essay' && <textarea disabled rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 resize-none" placeholder="Student writes essay here..." />}
                {q.type === 'matching' && <div className="grid grid-cols-2 gap-2">{q.options.map((o, oi) => (<div key={oi} className="bg-gray-50 rounded-xl px-3 py-2 text-sm">{o.text}</div>))}</div>}
                {q.hint_text && <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">💡 Hint available</p>}
              </div>
            ))}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Quiz Info</h3>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Title *</label>
                <input value={settings.title} onChange={e => updSettings('title', e.target.value)} className={inp} placeholder="e.g. Week 1 Assessment" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
                <textarea value={settings.description} onChange={e => updSettings('description', e.target.value)} rows={2} className={inp + ' resize-none'} placeholder="Brief description shown to students" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Instructions (shown before quiz starts)</label>
                <textarea value={settings.instructions} onChange={e => updSettings('instructions', e.target.value)} rows={3} className={inp + ' resize-none'} placeholder="e.g. Read each question carefully. You have 3 attempts. Use the hints if needed." />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Grading & Timing</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div><label className="text-xs font-medium text-gray-500 block mb-1.5">Passing Score (%)</label>
                  <input type="number" value={settings.passing_score} onChange={e => updSettings('passing_score', parseInt(e.target.value))} className={inp} min={0} max={100} /></div>
                <div><label className="text-xs font-medium text-gray-500 block mb-1.5">Max Attempts</label>
                  <input type="number" value={settings.max_attempts} onChange={e => updSettings('max_attempts', parseInt(e.target.value))} className={inp} min={1} /></div>
                <div><label className="text-xs font-medium text-gray-500 block mb-1.5">Time Limit (mins)</label>
                  <input type="number" value={settings.time_limit_minutes} onChange={e => updSettings('time_limit_minutes', e.target.value)} className={inp} placeholder="None" min={1} /></div>
                <div><label className="text-xs font-medium text-gray-500 block mb-1.5">Cooldown (mins)</label>
                  <input type="number" value={settings.cooldown_minutes} onChange={e => updSettings('cooldown_minutes', parseInt(e.target.value))} className={inp} placeholder="0 = no cooldown" min={0} /></div>
                <div className="col-span-2 sm:col-span-1"><label className="text-xs font-medium text-gray-500 block mb-1.5">Grading Method</label>
                  <select value={settings.grading_method} onChange={e => updSettings('grading_method', e.target.value)} className={inp + ' appearance-none'}>
                    <option value="highest">Highest score</option><option value="latest">Latest attempt</option>
                    <option value="average">Average score</option><option value="first">First attempt</option>
                  </select></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900">Behaviour</h3>
              {[
                { k: 'shuffle_questions', label: 'Shuffle question order for each attempt', icon: Shuffle },
                { k: 'shuffle_options', label: 'Shuffle answer options for each question', icon: Shuffle },
                { k: 'show_results_immediately', label: 'Show score immediately after submission', icon: Eye },
                { k: 'show_explanations', label: 'Show explanations after submission', icon: BookOpen },
                { k: 'require_previous_lesson', label: 'Require completing previous lesson first', icon: Target },
              ].map(opt => (
                <label key={opt.k} className="flex items-center gap-3 cursor-pointer py-1">
                  <input type="checkbox" checked={(settings as any)[opt.k]} onChange={e => updSettings(opt.k as any, e.target.checked)} className="w-4 h-4 accent-bloomy-600" />
                  <opt.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Show correct answers</label>
                <select value={settings.show_correct_answers} onChange={e => updSettings('show_correct_answers', e.target.value)} className={inp + ' appearance-none'}>
                  <option value="immediately">Immediately after submission</option>
                  <option value="after_close">After quiz availability window closes</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Availability Window (optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-gray-500 block mb-1.5">Available From</label>
                  <input type="datetime-local" value={settings.available_from} onChange={e => updSettings('available_from', e.target.value)} className={inp} /></div>
                <div><label className="text-xs font-medium text-gray-500 block mb-1.5">Available Until</label>
                  <input type="datetime-local" value={settings.available_until} onChange={e => updSettings('available_until', e.target.value)} className={inp} /></div>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="p-6">
            {!quizId ? (
              <div className="text-center py-12 text-gray-400"><BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Save the quiz first to see analytics</p></div>
            ) : !analytics ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>
            ) : (
              <div className="space-y-5 max-w-4xl">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Attempts', value: analytics.total_attempts },
                    { label: 'Students', value: analytics.unique_students },
                    { label: 'Avg Score', value: analytics.avg_score + '%' },
                    { label: 'Pass Rate', value: analytics.pass_rate + '%', highlight: analytics.pass_rate >= 70 },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                      <p className={`text-2xl font-bold ${s.highlight ? 'text-green-600' : 'text-gray-900'}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Score distribution */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Score Distribution</h3>
                  <div className="flex items-end gap-1 h-24">
                    {analytics.score_distribution.map((b: any) => {
                      const max = Math.max(...analytics.score_distribution.map((x: any) => x.count), 1)
                      const h = b.count > 0 ? Math.max(8, (b.count / max) * 96) : 0
                      return (
                        <div key={b.range} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500">{b.count > 0 ? b.count : ''}</span>
                          <div className="w-full rounded-t" style={{ height: `${h}px`, background: b.range.startsWith('7') || parseInt(b.range) >= 70 ? '#22c55e' : '#e5e7eb' }} />
                          <span className="text-xs text-gray-400 rotate-0" style={{ fontSize: 9 }}>{b.range}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Per question breakdown */}
                {analytics.per_question?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 text-sm">Per-Question Breakdown</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {analytics.per_question.map((q: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3">
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                          <p className="flex-1 text-sm text-gray-700 truncate">{q.text}</p>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-2 rounded-full" style={{ width: `${q.pct_correct}%`, background: q.pct_correct >= 70 ? '#22c55e' : q.pct_correct >= 40 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{q.pct_correct}%</span>
                            {q.difficulty_flag === 'hard' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Hard</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attempts table */}
                {analytics.attempts?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 text-sm">Recent Attempts ({analytics.attempts.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-96">
                        <thead><tr className="border-b border-gray-50">{['Student','Attempt','Score','Result','Submitted'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>)}</tr></thead>
                        <tbody>
                          {analytics.attempts.slice(0,20).map((a: any) => (
                            <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900">{a.full_name}</p><p className="text-xs text-gray-400">{a.email}</p></td>
                              <td className="px-4 py-3 text-sm text-gray-600">#{a.attempt_number}</td>
                              <td className="px-4 py-3 text-sm font-bold text-gray-900">{Math.round(a.final_score || a.auto_score || 0)}%</td>
                              <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{a.passed ? '✓ Passed' : '✗ Failed'}</span></td>
                              <td className="px-4 py-3 text-xs text-gray-400">{a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : 'In progress'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {analytics.total_attempts === 0 && (
                  <div className="text-center py-12 text-gray-400"><BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No attempts yet — publish the quiz so students can take it</p></div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (isModal) return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {content}
    </div>
  )
  return content
}
