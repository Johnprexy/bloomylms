'use client'
import { useState, useEffect } from 'react'
import { Loader2, Save, User, Lock, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Profile form
  const [form, setForm] = useState({ full_name: '', phone: '', bio: '', location: '' })

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      if (d.data) {
        setProfile(d.data)
        setForm({ full_name: d.data.full_name || '', phone: d.data.phone || '', bio: d.data.bio || '', location: d.data.location || '' })
      }
      setLoading(false)
    })
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json())
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError(''); setPwMsg('')
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match'); return }
    if (pwForm.next.length < 6) { setPwError('Password must be at least 6 characters'); return }
    setPwSaving(true)
    const res = await fetch('/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.next }),
    }).then(r => r.json())
    setPwSaving(false)
    if (res.error) { setPwError(res.error); return }
    setPwMsg('Password changed successfully!')
    setPwForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setPwMsg(''), 4000)
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-5 h-5 animate-spin text-bloomy-500" /></div>

  const initials = form.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 p-1"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5">
        <div className="w-16 h-16 bloomy-gradient rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-bold text-gray-900 text-lg">{form.full_name || 'Your Name'}</p>
          <p className="text-sm text-gray-400">{profile?.email}</p>
          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium capitalize">{profile?.role}</span>
        </div>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <User className="w-4 h-4 text-bloomy-500" />
          <h2 className="font-bold text-gray-900 text-sm">Personal Information</h2>
        </div>
        <form onSubmit={saveProfile} className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name</label>
              <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inp} placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inp} placeholder="+234 xxx xxx xxxx" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location</label>
            <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inp} placeholder="Lagos, Nigeria" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className={inp + ' resize-none'} placeholder="Tell us a bit about yourself..." />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm py-2.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            {saved && <span className="text-sm text-green-600 flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />Saved!</span>}
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Lock className="w-4 h-4 text-bloomy-500" />
          <h2 className="font-bold text-gray-900 text-sm">Change Password</h2>
        </div>
        <form onSubmit={changePassword} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                className={inp + ' pr-10'} placeholder="Enter current password" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
              <input type={showPw ? 'text' : 'password'} value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                className={inp} placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
              <input type={showPw ? 'text' : 'password'} value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                className={inp} placeholder="Repeat new password" />
            </div>
          </div>
          {pwError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{pwError}</p>}
          {pwMsg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-xl flex items-center gap-1.5"><CheckCircle className="w-4 h-4" />{pwMsg}</p>}
          <button type="submit" disabled={pwSaving || !pwForm.current || !pwForm.next}
            className="btn-primary flex items-center gap-2 text-sm py-2.5 disabled:opacity-50">
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {pwSaving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
