'use client'

import { useState, useEffect } from 'react'
import { Users, Calendar, Plus, CheckCircle, XCircle, Loader2, Trash2, UserPlus, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'

export default function AdminCohortsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [cohorts, setCohorts] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', course_id: '', start_date: '', end_date: '', max_students: 50 })
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/admin/cohorts-full').then(r => r.json()).then(d => {
      setCourses(d.courses || [])
      setCohorts(d.cohorts || [])
      setAllStudents(d.students || [])
      setLoading(false)
    })
  }, [])

  async function createCohort() {
    if (!form.name || !form.course_id) return
    setSaving(true)
    const res = await fetch('/api/admin/cohorts-full', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json())
    setSaving(false)
    if (res.data) {
      setCohorts(prev => [res.data, ...prev])
      setShowCreate(false)
      setForm({ name: '', course_id: '', start_date: '', end_date: '', max_students: 50 })
      setSuccess(`Cohort "${res.data.name}" created!`)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  async function addStudentToCohort(cohortId: string, studentId: string) {
    await fetch('/api/admin/cohorts-full', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cohort_id: cohortId, student_id: studentId, action: 'add' }),
    })
    const d = await fetch('/api/admin/cohorts-full').then(r => r.json())
    setCohorts(d.cohorts || [])
  }

  async function removeStudentFromCohort(cohortId: string, studentId: string) {
    await fetch('/api/admin/cohorts-full', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cohort_id: cohortId, student_id: studentId, action: 'remove' }),
    })
    const d = await fetch('/api/admin/cohorts-full').then(r => r.json())
    setCohorts(d.cohorts || [])
  }

  async function deleteCohort(cohortId: string, cohortName: string) {
    if (!confirm(`Delete cohort "${cohortName}"?\n\nThis will remove all students from this cohort. Enrollments will remain.`)) return
    await fetch(`/api/admin/cohorts-full?id=${cohortId}`, { method: 'DELETE' })
    setCohorts(prev => prev.filter(c => c.id !== cohortId))
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cohorts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Group students into class batches</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />New Cohort
        </button>
      </div>

      {success && <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100"><CheckCircle className="w-4 h-4" />{success}</div>}

      {showCreate && (
        <div className="bg-white rounded-2xl border border-bloomy-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Create New Cohort</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cohort Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inp} placeholder="e.g. DevOps 2026A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Course *</label>
              <select value={form.course_id} onChange={e => setForm(f => ({ ...f, course_id: e.target.value }))} className={inp}>
                <option value="">Select course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Students</label>
              <input type="number" value={form.max_students} onChange={e => setForm(f => ({ ...f, max_students: parseInt(e.target.value) }))} className={inp} min={1} />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={createCohort} disabled={saving || !form.name || !form.course_id} className="btn-primary flex items-center gap-2 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Create Cohort
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {cohorts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No cohorts yet — create your first one above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cohorts.map(cohort => (
            <div key={cohort.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div
                className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedCohort(expandedCohort === cohort.id ? null : cohort.id)}>
                <div className="w-12 h-12 bg-bloomy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-bloomy-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{cohort.name}</h3>
                  <p className="text-sm text-gray-400">{cohort.course_title} · {cohort.student_count || 0}/{cohort.max_students} students</p>
                </div>
                <div className="flex items-center gap-3">
                  {cohort.start_date && <span className="text-xs text-gray-400 hidden sm:block">from {new Date(cohort.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cohort.is_open ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cohort.is_open ? 'Open' : 'Closed'}
                  </span>
                  <button onClick={e => { e.stopPropagation(); deleteCohort(cohort.id, cohort.name) }}
                    className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedCohort === cohort.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {expandedCohort === cohort.id && (
                <div className="border-t border-gray-100 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm text-gray-900">Students in this cohort ({cohort.students?.length || 0})</h4>
                    <span className="text-xs text-gray-400">{cohort.max_students - (cohort.students?.length || 0)} spots remaining</span>
                  </div>

                  {/* Current students */}
                  {cohort.students?.length > 0 && (
                    <div className="space-y-2">
                      {cohort.students.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {s.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{s.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{s.email}</p>
                          </div>
                          <button onClick={() => removeStudentFromCohort(cohort.id, s.id)} className="text-gray-300 hover:text-red-400 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add student dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Add student to cohort</label>
                    <select
                      onChange={e => e.target.value && addStudentToCohort(cohort.id, e.target.value)}
                      defaultValue=""
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-bloomy-500 cursor-pointer">
                      <option value="">Select a student to add...</option>
                      {allStudents
                        .filter(s => !cohort.students?.some((cs: any) => cs.id === s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
