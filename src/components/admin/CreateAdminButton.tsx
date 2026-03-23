'use client'
import { useState } from 'react'
import { UserPlus, X, Eye, EyeOff, Copy, CheckCircle, Loader2, RefreshCw, Shield } from 'lucide-react'

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full access — manage admins, all settings', color: 'text-red-700 bg-red-50 border-red-200' },
  { value: 'admin', label: 'Admin', desc: 'Manage courses, students, cohorts, surveys', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  { value: 'instructor', label: 'Instructor', desc: 'Build courses and view their students', color: 'text-blue-700 bg-blue-50 border-blue-200' },
]

function generatePassword() {
  const words = ['Bloomy', 'Admin', 'Teach', 'Learn', 'Tech']
  const w = words[Math.floor(Math.random() * words.length)]
  const n = Math.floor(100 + Math.random() * 900)
  const s = ['!', '@', '#', '$'][Math.floor(Math.random() * 4)]
  return `${w}${n}${s}`
}

export default function CreateAdminButton() {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<any>(null)
  const [showPw, setShowPw] = useState(false)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', role: 'admin', password: generatePassword()
  })

  function reset() {
    setForm({ full_name: '', email: '', phone: '', role: 'admin', password: generatePassword() })
    setError(''); setCreated(null); setShowPw(false); setCopied(false)
  }

  async function create() {
    if (!form.full_name.trim() || !form.email.trim()) { setError('Name and email are required'); return }
    if (!form.password.trim() || form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(r => r.json())
    setSaving(false)
    if (res.error) { setError(res.error); return }
    setCreated(res.data)
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  return (
    <>
      <button onClick={() => { reset(); setOpen(true) }}
        className="btn-primary flex items-center gap-2 text-sm py-2.5">
        <UserPlus className="w-4 h-4" />Create Admin / Staff
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-bloomy-600" />
                <h2 className="font-bold text-gray-900">Create Admin / Staff Account</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {created ? (
              /* Success screen */
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800">Account created!</p>
                    <p className="text-sm text-green-600">{created.full_name} · {created.role.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Share these login details</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm font-mono font-medium text-gray-900">{created.email}</p>
                      </div>
                      <button onClick={() => copy(created.email)} className="text-bloomy-500 hover:text-bloomy-700 flex-shrink-0">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-xs text-gray-400">Password</p>
                        <p className={`text-sm font-mono font-bold text-gray-900 ${showPw ? '' : 'blur-sm select-none'}`}>
                          {created.temp_password}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-gray-600">
                          {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => copy(created.temp_password)} className="text-bloomy-500 hover:text-bloomy-700">
                          {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 font-medium">⚠ Share this password securely. They can change it from their Profile page.</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { reset() }} className="btn-secondary text-sm flex-1 flex items-center justify-center gap-1.5">
                    <UserPlus className="w-4 h-4" />Create Another
                  </button>
                  <button onClick={() => { setOpen(false); window.location.reload() }} className="btn-primary text-sm flex-1">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Form */
              <div className="p-6 space-y-4">
                {/* Role selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                  <div className="space-y-2">
                    {ROLES.map(r => (
                      <label key={r.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.role === r.value ? r.color + ' border-current' : 'border-gray-100 hover:border-gray-200'}`}>
                        <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                          onChange={() => setForm(f => ({ ...f, role: r.value }))} className="mt-0.5 accent-bloomy-600" />
                        <div>
                          <p className="font-semibold text-sm">{r.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                    <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      className={inp} placeholder="e.g. John Ayomide Akinola" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email *</label>
                    <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={inp} placeholder="ceo@bloomy360.com" type="email" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className={inp} placeholder="+234..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                    <div className="relative">
                      <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        type={showPw ? 'text' : 'password'}
                        className={inp + ' pr-16 font-mono'} placeholder="Min 6 characters" />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400 hover:text-gray-600 p-1">
                          {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button type="button" title="Generate new password"
                          onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                          className="text-gray-400 hover:text-bloomy-600 p-1">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Click 🔄 to generate a strong password</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setOpen(false)} className="btn-secondary text-sm flex-1">Cancel</button>
                  <button onClick={create} disabled={saving}
                    className="btn-primary text-sm flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><UserPlus className="w-4 h-4" />Create Account</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
