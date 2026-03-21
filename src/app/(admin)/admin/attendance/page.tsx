'use client'
import { useState, useEffect } from 'react'
import { Loader2, Plus, Save, CheckCircle, Users, Calendar, ChevronRight, BookOpen } from 'lucide-react'

const STATUS = [
  { value: 'present', label: 'Present', short: 'P', cls: 'bg-green-500 text-white border-green-500' },
  { value: 'absent',  label: 'Absent',  short: 'A', cls: 'bg-red-500 text-white border-red-500'   },
  { value: 'late',    label: 'Late',    short: 'L', cls: 'bg-yellow-400 text-white border-yellow-400' },
  { value: 'excused', label: 'Excused', short: 'E', cls: 'bg-blue-400 text-white border-blue-400'  },
]

export default function AttendancePage() {
  // Data
  const [cohorts, setCohorts]   = useState<any[]>([])
  const [modules, setModules]   = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [records,  setRecords]  = useState<Record<string, string>>({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Selection
  const [selCohort,  setSelCohort]  = useState<any>(null)
  const [selCourse,  setSelCourse]  = useState<any>(null)   // { course_id, course_title }
  const [selModule,  setSelModule]  = useState<any>(null)   // full module row
  const [selSession, setSelSession] = useState<any>(null)

  // New session
  const [showNew,  setShowNew]  = useState(false)
  const [newDate,  setNewDate]  = useState(new Date().toISOString().split('T')[0])
  const [newTitle, setNewTitle] = useState('')

  // Unique cohorts
  const uniqueCohorts = Array.from(new Map(cohorts.map((c: any) => [c.id, c])).values())
  // Courses under selected cohort
  const cohortCourses = cohorts.filter((c: any) => c.id === selCohort?.id)

  useEffect(() => {
    fetch('/api/admin/attendance').then(r => r.json()).then(d => {
      setCohorts(d.cohorts || [])
      setLoading(false)
    })
  }, [])

  async function selectCourse(c: any) {
    setSelCourse(c); setSelModule(null); setSelSession(null); setStudents([]); setRecords({})
    const d = await fetch(`/api/admin/attendance?course_id=${c.course_id}&cohort_id=${selCohort?.id}`).then(r => r.json())
    setModules(d.modules || [])
    setSessions(d.sessions || [])
  }

  async function loadSession(sess: any) {
    setSelSession(sess)
    const d = await fetch(`/api/admin/attendance?session_id=${sess.id}`).then(r => r.json())
    setStudents(d.students || [])
    const rec: Record<string, string> = {}
    d.records?.forEach((r: any) => { rec[r.student_id] = r.status })
    setRecords(rec)
  }

  async function createSession() {
    if (!selCourse || !newDate || !selModule) return
    setSaving(true)
    const title = newTitle || `${selModule.title} — ${newDate}`
    const res = await fetch('/api/admin/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: selCourse.course_id,
        cohort_id: selCohort?.id,
        title,
        session_date: newDate,
      }),
    }).then(r => r.json())
    setSaving(false)
    if (res.data) {
      const newSess = { ...res.data, course_title: selCourse.course_title, cohort_name: selCohort?.name }
      setSessions(prev => [newSess, ...prev])
      setShowNew(false)
      setNewTitle('')
      await loadSession(newSess)
    }
  }

  async function saveAttendance() {
    if (!selSession) return
    setSaving(true)
    await fetch('/api/admin/attendance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: selSession.id, records }),
    })
    setSaving(false)
    setSavedMsg('Saved!')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  function markAll(status: string) {
    const all: Record<string, string> = {}
    students.forEach(s => { all[s.id] = status })
    setRecords(all)
  }

  // Sessions for selected module (filtered by title prefix)
  const moduleSessions = selModule
    ? sessions.filter((s: any) => s.title?.startsWith(selModule.title))
    : sessions

  const presentCount = Object.values(records).filter(v => v === 'present').length
  const absentCount  = Object.values(records).filter(v => v === 'absent').length
  const lateCount    = Object.values(records).filter(v => v === 'late').length
  const excusedCount = Object.values(records).filter(v => v === 'excused').length

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track by Cohort → Course → Module → Students</p>
        </div>
        {selModule && (
          <button onClick={() => setShowNew(!showNew)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />New Session
          </button>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        {[
          { n: 1, label: selCohort?.name || 'Select Cohort', done: !!selCohort },
          { n: 2, label: selCourse?.course_title || 'Select Course', done: !!selCourse },
          { n: 3, label: selModule?.title || 'Select Module / Week', done: !!selModule },
          { n: 4, label: selSession?.title || 'Select / Create Session', done: !!selSession },
        ].map((step, i) => (
          <div key={step.n} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${step.done ? 'bg-bloomy-100 text-bloomy-700' : 'bg-gray-100 text-gray-400'}`}>
              <span className={`w-4 h-4 rounded-full text-xs flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-bloomy-600 text-white' : 'bg-gray-300 text-gray-600'}`}>{step.n}</span>
              <span className="truncate max-w-32">{step.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* STEP 1 — Cohort */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">1. Cohort</p>
          </div>
          <div className="divide-y divide-gray-50">
            {uniqueCohorts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8 px-4">No cohorts yet.<br/>Create one in Admin → Cohorts</p>
            ) : uniqueCohorts.map((c: any) => (
              <button key={c.id}
                onClick={() => { setSelCohort(c); setSelCourse(null); setSelModule(null); setSelSession(null); setStudents([]) }}
                className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${selCohort?.id === c.id ? 'bg-bloomy-50 border-l-2 border-bloomy-500' : ''}`}>
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.student_count} students</p>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 2 — Course */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">2. Course</p>
          </div>
          {!selCohort ? (
            <div className="flex items-center justify-center py-12 text-xs text-gray-400">Select cohort first</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {cohortCourses.map((c: any) => (
                <button key={c.course_id}
                  onClick={() => selectCourse(c)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${selCourse?.course_id === c.course_id ? 'bg-bloomy-50 border-l-2 border-bloomy-500' : ''}`}>
                  <div className="flex items-start gap-2.5">
                    <BookOpen className="w-4 h-4 text-bloomy-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-gray-900 leading-snug">{c.course_title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* STEP 3 — Module / Week */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">3. Module / Week</p>
          </div>
          {!selCourse ? (
            <div className="flex items-center justify-center py-12 text-xs text-gray-400">Select course first</div>
          ) : modules.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-gray-400 px-4 text-center">
              No modules found in this course
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {modules.map((m: any) => {
                // Show text headers (days) under each module as sub-items
                const days = (m.lessons || []).filter((l: any) => l.type === 'text_header')
                return (
                  <div key={m.id}>
                    {/* Week/Module header */}
                    <button
                      onClick={() => { setSelModule(m); setSelSession(null); setStudents([]); setRecords({}) }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selModule?.id === m.id ? 'bg-bloomy-50 border-l-2 border-bloomy-500' : ''}`}>
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wide">{m.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{days.length > 0 ? `${days.length} days` : `${m.lesson_count} lessons`}</p>
                    </button>
                    {/* Day sub-items */}
                    {days.map((day: any) => (
                      <button key={day.id}
                        onClick={() => {
                          const dayModule = { ...m, title: day.title, _day: true, _moduleId: m.id }
                          setSelModule(dayModule); setSelSession(null); setStudents([]); setRecords({})
                        }}
                        className={`w-full text-left pl-7 pr-4 py-2.5 hover:bg-gray-50 transition-colors border-t border-gray-50 ${selModule?.title === day.title ? 'bg-blue-50 border-l-2 border-blue-400' : ''}`}>
                        <p className="text-xs text-gray-700 leading-snug">{day.title}</p>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* STEP 4 — Sessions */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">4. Sessions</p>
            {selModule && (
              <button onClick={() => setShowNew(!showNew)} className="text-xs text-bloomy-600 font-medium hover:underline">+ New</button>
            )}
          </div>
          {!selModule ? (
            <div className="flex items-center justify-center py-12 text-xs text-gray-400">Select module first</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {moduleSessions.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 px-4">
                  <Calendar className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  No sessions yet<br/>Click + New to create one
                </div>
              ) : moduleSessions.map((s: any) => (
                <button key={s.id} onClick={() => loadSession(s)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${selSession?.id === s.id ? 'bg-bloomy-50 border-l-2 border-bloomy-500' : ''}`}>
                  <p className="text-xs font-semibold text-gray-900 truncate">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(s.session_date).toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New session form */}
      {showNew && selModule && (
        <div className="bg-white rounded-2xl border border-bloomy-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-4">New Attendance Session — {selModule.title}</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Session Title</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder={`${selModule.title} — ${newDate}`}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date *</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={createSession} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Create & Mark
            </button>
            <button onClick={() => setShowNew(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Attendance marking */}
      {selSession && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-bold text-gray-900">{selSession.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selCohort?.name} · {selCourse?.course_title} · {students.length} students
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {savedMsg && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{savedMsg}</span>}
                <button onClick={() => markAll('present')} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100">All Present</button>
                <button onClick={() => markAll('absent')} className="text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100">All Absent</button>
                <button onClick={saveAttendance} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5 py-2">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                </button>
              </div>
            </div>

            {/* Summary pills */}
            {students.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {[
                  { label: `${presentCount} Present`, cls: 'bg-green-50 text-green-700' },
                  { label: `${absentCount} Absent`,   cls: 'bg-red-50 text-red-700'   },
                  { label: `${lateCount} Late`,        cls: 'bg-yellow-50 text-yellow-700' },
                  { label: `${excusedCount} Excused`,  cls: 'bg-blue-50 text-blue-700' },
                ].filter(s => parseInt(s.label) > 0).map(s => (
                  <span key={s.label} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
                ))}
                <span className="text-xs text-gray-400">
                  {Object.keys(records).length}/{students.length} marked
                </span>
              </div>
            )}
          </div>

          {/* Student list */}
          {students.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />No students enrolled in this course
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {students.map((student: any, si: number) => {
                const status = records[student.id] || ''
                return (
                  <div key={student.id} className={`flex items-center gap-3 px-5 py-3.5 ${si % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <div className="w-9 h-9 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{student.full_name}</p>
                      <p className="text-xs text-gray-400 truncate">{student.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {STATUS.map(opt => (
                        <button key={opt.value} onClick={() => setRecords(r => ({ ...r, [student.id]: opt.value }))}
                          className={`text-xs font-bold w-10 h-9 rounded-xl border-2 transition-all ${status === opt.value ? opt.cls : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}>
                          {opt.short}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
