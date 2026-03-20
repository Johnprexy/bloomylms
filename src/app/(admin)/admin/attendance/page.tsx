'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Plus, Users, Calendar, Download } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  { value: 'late', label: 'Late', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  { value: 'excused', label: 'Excused', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-700', icon: XCircle },
]

export default function AttendancePage() {
  const [courses, setCourses] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [records, setRecords] = useState<Record<string, string>>({})
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'mark' | 'history'>('mark')
  const [newSession, setNewSession] = useState({ title: '', session_date: new Date().toISOString().split('T')[0] })
  const [showNewSession, setShowNewSession] = useState(false)

  useEffect(() => {
    fetch('/api/admin/attendance').then(r => r.json()).then(d => {
      setCourses(d.courses || [])
      setSessions(d.sessions || [])
      setLoading(false)
    })
  }, [])

  async function loadSession(session: any) {
    setSelectedSession(session)
    setSelectedCourse(session.course_id)
    const d = await fetch(`/api/admin/attendance?session_id=${session.id}`).then(r => r.json())
    setStudents(d.students || [])
    const rec: Record<string, string> = {}
    d.records?.forEach((r: any) => { rec[r.student_id] = r.status })
    setRecords(rec)
    setTab('mark')
  }

  async function createSession() {
    if (!selectedCourse || !newSession.title) return
    setSaving(true)
    const res = await fetch('/api/admin/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: selectedCourse, ...newSession }),
    }).then(r => r.json())
    setSaving(false)
    if (res.data) {
      await loadSession(res.data)
      const d = await fetch('/api/admin/attendance').then(r => r.json())
      setSessions(d.sessions || [])
      setShowNewSession(false)
      setNewSession({ title: '', session_date: new Date().toISOString().split('T')[0] })
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
    alert('Attendance saved!')
  }

  function markAll(status: string) {
    const updated: Record<string, string> = {}
    students.forEach(s => { updated[s.id] = status })
    setRecords(updated)
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track student attendance per session</p>
        </div>
        <button onClick={() => setShowNewSession(!showNewSession)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />New Session
        </button>
      </div>

      {showNewSession && (
        <div className="bg-white rounded-2xl border border-bloomy-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Create Attendance Session</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Course *</label>
              <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className={inp}>
                <option value="">Select...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Session Title *</label>
              <input value={newSession.title} onChange={e => setNewSession(s => ({ ...s, title: e.target.value }))} className={inp} placeholder="e.g. Day 1 – Excel Basics" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
              <input type="date" value={newSession.session_date} onChange={e => setNewSession(s => ({ ...s, session_date: e.target.value }))} className={inp} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createSession} disabled={saving || !selectedCourse || !newSession.title} className="btn-primary text-sm flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Create & Mark
            </button>
            <button onClick={() => setShowNewSession(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sessions list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100"><p className="font-semibold text-sm text-gray-900">Sessions ({sessions.length})</p></div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm"><Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />No sessions yet</div>
            ) : sessions.map(s => (
              <button key={s.id} onClick={() => loadSession(s)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedSession?.id === s.id ? 'bg-bloomy-50 border-l-2 border-bloomy-500' : ''}`}>
                <p className="text-sm font-medium text-gray-900 truncate">{s.title || s.session_title}</p>
                <p className="text-xs text-gray-400">{s.course_title} · {new Date(s.session_date).toLocaleDateString('en-GB')}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Attendance marking */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {!selectedSession ? (
            <div className="flex items-center justify-center h-full py-20 text-gray-400">
              <div className="text-center"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Select a session to mark attendance</p></div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-bold text-gray-900">{selectedSession.title || selectedSession.session_title}</p>
                  <p className="text-xs text-gray-400">{selectedSession.course_title} · {students.length} students</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => markAll('present')} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100">All Present</button>
                  <button onClick={saveAttendance} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}Save
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {students.map(student => {
                  const status = records[student.id] || 'absent'
                  return (
                    <div key={student.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{student.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => setRecords(r => ({ ...r, [student.id]: opt.value }))}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all ${status === opt.value ? opt.color : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                            {opt.label}
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
    </div>
  )
}
