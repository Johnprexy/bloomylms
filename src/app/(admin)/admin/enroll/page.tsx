'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, CheckCircle, Loader2, X, Users, BookOpen, Filter } from 'lucide-react'

export default function EnrollStudentsPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [enrolling, setEnrolling] = useState(false)
  const [result, setResult] = useState<{ enrolled: number; skipped: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'not_enrolled' | 'enrolled'>('all')

  useEffect(() => {
    fetch('/api/admin/course-builder').then(r => r.json()).then(d => setCourses(d.data || []))
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    setLoading(true)
    setSelected(new Set())
    setResult(null)
    fetch(`/api/admin/enroll?course_id=${selectedCourse.id}&search=${search}&filter=${filter}`)
      .then(r => r.json()).then(d => { setUsers(d.data || []); setLoading(false) })
  }, [selectedCourse, search, filter])

  async function handleEnroll() {
    if (!selectedCourse || selected.size === 0) return
    setEnrolling(true)
    const res = await fetch('/api/admin/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: selectedCourse.id, user_ids: Array.from(selected) }),
    }).then(r => r.json())
    setEnrolling(false)
    setResult(res.data)
    setSelected(new Set())
    // Refresh list
    const d = await fetch(`/api/admin/enroll?course_id=${selectedCourse.id}&search=${search}&filter=${filter}`).then(r => r.json())
    setUsers(d.data || [])
  }

  const toggleUser = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => {
    const notEnrolled = users.filter(u => !u.enrolled)
    if (selected.size === notEnrolled.length) setSelected(new Set())
    else setSelected(new Set(notEnrolled.map(u => u.id)))
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enroll Students</h1>
        <p className="text-sm text-gray-500 mt-1">Select a course and enroll existing users in bulk</p>
      </div>

      {/* Step 1 — Pick Course */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2"><span className="w-6 h-6 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">1</span>Select Course</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {courses.map(c => (
            <button key={c.id} onClick={() => setSelectedCourse(c)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${selectedCourse?.id === c.id ? 'border-bloomy-500 bg-bloomy-50' : 'border-gray-100 hover:border-gray-200'}`}>
              <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
              <p className="text-xs text-gray-400 mt-1">{c.total_students || 0} enrolled</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Pick Users */}
      {selectedCourse && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">2</span>
              Select Users for: <span className="text-bloomy-700">{selectedCourse.title}</span>
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500" />
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[['all','All'],['not_enrolled','Not enrolled'],['enrolled','Enrolled']].map(([v,l]) => (
                  <button key={v} onClick={() => setFilter(v as any)} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${filter === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {result && (
            <div className="mx-5 mt-4 flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Enrolled {result.enrolled} student{result.enrolled !== 1 ? 's' : ''}{result.skipped > 0 ? `, ${result.skipped} already enrolled (skipped)` : ''}
            </div>
          )}

          <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-bloomy-500" /></div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-sm">No users found</p></div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-white border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 w-10">
                      <input type="checkbox" checked={selected.size > 0 && selected.size === users.filter(u => !u.enrolled).length} onChange={toggleAll} className="accent-bloomy-600 cursor-pointer" />
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">User</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Role</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className={`border-b border-gray-50 transition-colors ${u.enrolled ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'}`} onClick={() => !u.enrolled && toggleUser(u.id)}>
                      <td className="px-5 py-3">
                        <input type="checkbox" checked={selected.has(u.id)} disabled={u.enrolled} onChange={() => {}} className="accent-bloomy-600" />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div>
                          <div><p className="font-medium text-sm text-gray-900">{u.full_name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'instructor' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{u.role}</span></td>
                      <td className="px-5 py-3">
                        {u.enrolled ? <span className="flex items-center gap-1 text-xs text-green-700 font-medium"><CheckCircle className="w-3.5 h-3.5" />Enrolled</span> : <span className="text-xs text-gray-400">Not enrolled</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-600">
              {selected.size > 0 ? <><span className="font-bold text-gray-900">{selected.size}</span> user{selected.size !== 1 ? 's' : ''} selected</> : 'No users selected'}
            </p>
            <button onClick={handleEnroll} disabled={selected.size === 0 || enrolling}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Enroll {selected.size > 0 ? selected.size : ''} Student{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
