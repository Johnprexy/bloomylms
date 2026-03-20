'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Search, Loader2, CheckCircle, BookOpen, Users, Star, MoreVertical, Mail } from 'lucide-react'

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', bio: '', assigned_courses: [] as string[] })

  useEffect(() => {
    fetch('/api/admin/instructors').then(r => r.json()).then(d => {
      setInstructors(d.instructors || [])
      setCourses(d.courses || [])
      setLoading(false)
    })
  }, [])

  async function createInstructor() {
    if (!form.email || !form.password || !form.full_name) return
    setSaving(true)
    const res = await fetch('/api/admin/instructors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json())
    setSaving(false)
    if (res.data) {
      setInstructors(prev => [res.data, ...prev])
      setShowCreate(false)
      setForm({ full_name: '', email: '', password: '', phone: '', bio: '', assigned_courses: [] })
      setSuccess(`Instructor account created for ${res.data.full_name}`)
      setTimeout(() => setSuccess(''), 4000)
    }
  }

  async function assignCourse(instructorId: string, courseId: string) {
    await fetch('/api/admin/instructors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructor_id: instructorId, course_id: courseId }),
    })
    const d = await fetch('/api/admin/instructors').then(r => r.json())
    setInstructors(d.instructors || [])
  }

  const filtered = instructors.filter(i =>
    i.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase())
  )
  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
          <p className="text-sm text-gray-500 mt-1">{instructors.length} instructor{instructors.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus className="w-4 h-4" />Create Instructor
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />{success}
        </div>
      )}

      {/* Create Instructor Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-bloomy-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-5">New Instructor Account</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label><input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} className={inp} placeholder="John Doe" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={inp} placeholder="instructor@example.com" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label><input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className={inp} placeholder="Min. 8 characters" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className={inp} placeholder="+234 xxx xxx xxxx" /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label><textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={3} className={inp + ' resize-none'} placeholder="Instructor background and expertise..." /></div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Courses (optional)</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {courses.filter(c => c.status !== 'archived').map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={form.assigned_courses.includes(c.id)} onChange={e => {
                      setForm(f => ({ ...f, assigned_courses: e.target.checked ? [...f.assigned_courses, c.id] : f.assigned_courses.filter(id => id !== c.id) }))
                    }} className="accent-bloomy-600" />
                    <span className="truncate text-gray-700">{c.title}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button onClick={createInstructor} disabled={saving || !form.email || !form.password || !form.full_name} className="btn-primary flex items-center gap-2 text-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}Create Account
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search instructors..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500" />
      </div>

      {/* Instructors List */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">No instructors found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(inst => (
            <div key={inst.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bloomy-gradient rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                  {inst.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{inst.full_name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{inst.email}</p>
                  {inst.bio && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{inst.bio}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pt-3 border-t border-gray-50">
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{inst.course_count || 0} courses</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{inst.student_count || 0} students</span>
                {inst.avg_rating > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{Number(inst.avg_rating).toFixed(1)}</span>}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Assign course:</p>
                <select onChange={e => e.target.value && assignCourse(inst.id, e.target.value)} defaultValue="" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-bloomy-400 cursor-pointer">
                  <option value="" disabled>Select a course to assign...</option>
                  {courses.filter(c => c.status !== 'archived').map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
