'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Plus, Users, Calendar, ChevronRight, ChevronDown, Save } from 'lucide-react'

const STATUS = [
  { value: 'present', label: 'Present', short: 'P', color: 'bg-green-500 text-white', border: 'border-green-500' },
  { value: 'absent',  label: 'Absent',  short: 'A', color: 'bg-red-500 text-white',   border: 'border-red-500'   },
  { value: 'late',    label: 'Late',    short: 'L', color: 'bg-yellow-400 text-white', border: 'border-yellow-400'},
  { value: 'excused', label: 'Excused', short: 'E', color: 'bg-blue-400 text-white',   border: 'border-blue-400'  },
]

export default function AttendancePage() {
  const [cohorts, setCohorts] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // Selection state
  const [selectedCohort, setSelectedCohort] = useState<any>(null)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [selectedSession, setSelectedSession] = useState<any>(null)

  // Mark state
  const [students, setStudents] = useState<any[]>([])
  const [records, setRecords] = useState<Record<string, string>>({})

  // New session form
  const [showNew, setShowNew] = useState(false)
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    fetch('/api/admin/attendance').then(r => r.json()).then(d => {
      setCohorts(d.cohorts || [])
      setSessions(d.sessions || [])
      setLoading(false)
    })
  }, [])

  // Unique cohorts (multiple rows if multiple courses)
  const uniqueCohorts = Array.from(new Map(cohorts.map((c: any) => [c.id, c])).values())

  // Courses under selected cohort
  const cohortCourses = cohorts.filter((c: any) => c.id === selectedCohort?.id)

  // Sessions under selected cohort + course
  const filteredSessions = sessions.filter((s: any) =>
    s.cohort_id === selectedCohort?.id && s.course_id === selectedCourse?.course_id
  )

  async function selectSession(sess: any) {
    setSelectedSession(sess)
    const d = await fetch(`/api/admin/attendance?session_id=${sess.id}`).then(r => r.json())
    setStudents(d.students || [])
    const rec: Record<string, string> = {}
    d.records?.forEach((r: any) => { rec[r.student_id] = r.status })
    setRecords(rec)
  }

  async function createSession() {
    if (!selectedCourse || !newDate) return
    setSaving(true)
    const res = await fetch('/api/admin/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_id: selectedCourse.course_id,
        cohort_id: selectedCohort.id,
        title: newTitle || `Session – ${newDate}`,
        session_date: newDate,
      }),
    }).then(r => r.json())
    setSaving(false)
    if (res.data) {
      const newSess = { ...res.data, course_title: selectedCourse.course_title, cohort_name: selectedCohort.name }
      setSessions(prev => [newSess, ...prev])
      setShowNew(false)
      setNewTitle('')
      await selectSession(newSess)
    }
  }

  async function saveAttendance() {
    if (!selectedSession) return
    setSaving(true)
    await fetch('/api/admin/attendance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: selectedSession.id, records }),
    })
    setSaving(false)
    setSavedMsg('Attendance saved!')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  function markAll(status: string) {
    const all: Record<string, string> = {}
    students.forEach(s => { all[s.id] = status })
    setRecords(all)
  }

  const presentCount = Object.values(records).filter(v => v === 'present').length
  const absentCount  = Object.values(records).filter(v => v === 'absent').length
  const lateCount    = Object.values(records).filter(v => v === 'late').length
  const excusedCount = Object.values(records).filter(v => v === 'excused').length

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track by cohort → course → session</p>
        </div>
        {selectedCourse && (
          <button onClick={() => setShowNew(!showNew)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Session
          </button>
        )}
      </div>

      {/* Step 1: Select Cohort */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-bloomy-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
          <span className="font-semibold text-sm text-gray-900">Select Cohort</span>
        </div>
        {uniqueCohorts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No cohorts created yet. Go to Admin → Cohorts first.</div>
        ) : (
          <div className="flex flex-wrap gap-2 p-4">
            {uniqueCohorts.map((c: any) => (
              <button key={c.id} onClick={() => { setSelectedCohort(c); setSelectedCourse(null); setSelectedSession(null); setStudents([]) }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${selectedCohort?.id === c.id ? 'border-bloomy-600 bg-bloomy-50 text-bloomy-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs opacity-70">{c.student_count} students</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Select Course */}
      {selectedCohort && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-bloomy-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
            <span className="font-semibold text-sm text-gray-900">Select Course under {selectedCohort.name}</span>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {cohortCourses.map((c: any) => (
              <button key={c.course_id} onClick={() => { setSelectedCourse(c); setSelectedSession(null); setStudents([]) }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${selectedCourse?.course_id === c.course_id ? 'border-bloomy-600 bg-bloomy-50 text-bloomy-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                📚 {c.course_title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New session form */}
      {showNew && selectedCourse && (
        <div className="bg-white rounded-2xl border border-bloomy-100 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm">New Attendance Session</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Session Title</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Day 1 – Linux Basics"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date *</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createSession} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Create & Mark
            </button>
            <button onClick={() => setShowNew(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Step 3: Sessions + Marking */}
      {selectedCourse && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Sessions list */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-bloomy-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
              <span className="font-semibold text-sm text-gray-900">Sessions ({filteredSessions.length})</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No sessions yet — create one above
                </div>
              ) : filteredSessions.map((s: any) => (
                <button key={s.id} onClick={() => selectSession(s)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${selectedSession?.id === s.id ? 'bg-bloomy-50 border-l-2 border-bloomy-500' : ''}`}>
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.title || 'Session'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(s.session_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Attendance marking */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {!selectedSession ? (
              <div className="flex items-center justify-center h-full py-20 text-gray-400 text-sm text-center p-6">
                <div><Users className="w-10 h-10 mx-auto mb-3 opacity-30" />Select a session to mark attendance</div>
              </div>
            ) : (
              <>
                {/* Session header */}
                <div className="px-5 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-bold text-gray-900">{selectedSession.title || 'Session'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{selectedCohort.name} · {selectedCourse.course_title} · {students.length} students</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {savedMsg && <span className="text-xs text-green-600 font-medium">{savedMsg}</span>}
                      <button onClick={saveAttendance} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5 py-2">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
                      </button>
                    </div>
                  </div>
                  {/* Quick stats */}
                  {students.length > 0 && (
                    <div className="flex items-center gap-3 mt-3">
                      {[
                        { label: 'Present', count: presentCount, color: 'text-green-600 bg-green-50' },
                        { label: 'Absent', count: absentCount, color: 'text-red-600 bg-red-50' },
                        { label: 'Late', count: lateCount, color: 'text-yellow-600 bg-yellow-50' },
                        { label: 'Excused', count: excusedCount, color: 'text-blue-600 bg-blue-50' },
                      ].map(s => (
                        <span key={s.label} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
                          {s.count} {s.label}
                        </span>
                      ))}
                      <button onClick={() => markAll('present')} className="ml-auto text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium">
                        All Present
                      </button>
                    </div>
                  )}
                </div>

                {/* Student list */}
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {students.map((student, si) => {
                    const status = records[student.id] || ''
                    return (
                      <div key={student.id} className="flex items-center gap-3 px-4 py-3">
                        {/* Avatar */}
                        <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{student.full_name}</p>
                        </div>
                        {/* Status buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {STATUS.map(opt => (
                            <button key={opt.value} onClick={() => setRecords(r => ({ ...r, [student.id]: opt.value }))}
                              className={`text-xs font-bold w-9 h-9 rounded-lg border-2 transition-all ${
                                status === opt.value ? opt.color + ' ' + opt.border : 'border-gray-200 text-gray-400 hover:border-gray-300'
                              }`}>
                              {opt.short}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
