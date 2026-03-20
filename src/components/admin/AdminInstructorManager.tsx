'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Users, BookOpen, Mail, Phone, MapPin, Shield, Loader2, Eye, EyeOff, X } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminInstructorManager({ instructors: initial, currentRole }: { instructors: any[], currentRole: string }) {
  const router = useRouter()
  const [instructors, setInstructors] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', bio: '', location: '' })

  const inp = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  async function createInstructor(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/admin/instructors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json())
    setSaving(false)
    if (res.error) { setMsg(res.error); return }
    setMsg('✓ Instructor created successfully')
    setForm({ full_name: '', email: '', password: '', phone: '', bio: '', location: '' })
    setShowForm(false)
    router.refresh()
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !current }) })
    setInstructors(prev => prev.map(i => i.id === id ? { ...i, is_active: !current } : i))
  }

  const roleColor = (role: string) => ({
    super_admin: 'bg-purple-50 text-purple-700',
    admin: 'bg-red-50 text-red-700',
    instructor: 'bg-blue-50 text-blue-700',
  }[role] || 'bg-gray-100 text-gray-600')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
          <p className="text-sm text-gray-500 mt-0.5">{instructors.length} instructors on platform</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Instructor
        </button>
      </div>

      {msg && <div className={`text-sm font-medium px-4 py-3 rounded-lg ${msg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

      {/* Create instructor modal */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900">Create New Instructor Account</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={createInstructor} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
              <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} required className={inp} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required className={inp} placeholder="instructor@bloomy360.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required minLength={8} className={inp} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className={inp} placeholder="+234 xxx xxx xxxx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} className={inp} placeholder="Lagos, Nigeria" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <input value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} className={inp} placeholder="Short bio..." />
            </div>
            <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Instructor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Instructors grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instructors.map(inst => (
          <div key={inst.id} className={`bg-white rounded-xl border p-5 ${inst.is_active ? 'border-gray-100' : 'border-red-100 opacity-70'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bloomy-gradient rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {inst.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleColor(inst.role)}`}>{inst.role.replace('_', ' ')}</span>
            </div>
            <h3 className="font-semibold text-gray-900">{inst.full_name}</h3>
            <div className="space-y-1 mt-2 mb-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-400"><Mail className="w-3 h-3" />{inst.email}</div>
              {inst.phone && <div className="flex items-center gap-1.5 text-xs text-gray-400"><Phone className="w-3 h-3" />{inst.phone}</div>}
              {inst.location && <div className="flex items-center gap-1.5 text-xs text-gray-400"><MapPin className="w-3 h-3" />{inst.location}</div>}
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-500"><BookOpen className="w-3 h-3" />{inst.course_count} courses</div>
              <div className="flex items-center gap-1 text-xs text-gray-500"><Users className="w-3 h-3" />{inst.total_students} students</div>
              <div className="ml-auto">
                <button onClick={() => toggleActive(inst.id, inst.is_active)}
                  className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${inst.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                  {inst.is_active ? <><EyeOff className="w-3 h-3" /> Deactivate</> : <><Eye className="w-3 h-3" /> Activate</>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
