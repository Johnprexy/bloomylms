'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Lock, User } from 'lucide-react'
import { signIn } from 'next-auth/react'

function SetupForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') || ''

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'done'>('loading')
  const [invitation, setInvitation] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    fetch(`/api/setup-account?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) { setInvitation(d.data); setForm(f => ({ ...f, full_name: d.data.full_name || '' })); setStatus('valid') }
        else setStatus('invalid')
      })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name) { setError('Please enter your full name'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    setSaving(true); setError('')

    const res = await fetch('/api/setup-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, full_name: form.full_name, password: form.password }),
    }).then(r => r.json())

    if (res.error) { setError(res.error); setSaving(false); return }

    // Auto sign in
    const signInRes = await signIn('credentials', {
      email: invitation.email,
      password: form.password,
      redirect: false,
    })

    setSaving(false)
    if (signInRes?.ok) {
      setStatus('done')
      setTimeout(() => router.push('/dashboard'), 2000)
    } else {
      setStatus('done')
    }
  }

  const inp = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  if (status === 'loading') return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-bloomy-500 mx-auto" />
      <p className="text-gray-400 text-sm mt-3">Verifying your invitation...</p>
    </div>
  )

  if (status === 'invalid') return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-7 h-7 text-red-500" /></div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid or expired link</h2>
      <p className="text-gray-500 text-sm mb-6">This setup link is invalid or has expired (links expire after 48 hours). Please contact your administrator to send a new invitation.</p>
      <Link href="/login" className="btn-primary inline-flex">Go to Sign In</Link>
    </div>
  )

  if (status === 'done') return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-500" /></div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Account activated! 🎉</h2>
      <p className="text-gray-500 text-sm mb-2">Welcome to BloomyLMS. You're now enrolled in:</p>
      <p className="font-semibold text-bloomy-700 text-sm mb-6">{invitation?.course_title}</p>
      <p className="text-xs text-gray-400">Redirecting to your dashboard...</p>
    </div>
  )

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bloomy-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <img src="/bloomy-logo.jpg" alt="Bloomy" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Activate Your Account</h1>
          <p className="text-gray-500 text-sm">Set your password to access BloomyLMS</p>
        </div>

        {/* Course pill */}
        <div className="bg-bloomy-50 border border-bloomy-100 rounded-xl p-3.5 mb-6 flex items-center gap-3">
          <div className="w-9 h-9 bloomy-gradient rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-base">📚</span>
          </div>
          <div>
            <p className="text-xs text-bloomy-500 font-medium">You're enrolled in</p>
            <p className="text-sm font-bold text-bloomy-800">{invitation?.course_title}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 text-sm text-gray-600">
          Signing up as: <span className="font-semibold text-gray-900">{invitation?.email}</span>
        </div>

        {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 border border-red-100"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} className={inp + ' pl-10'} placeholder="John Doe" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Create Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className={inp + ' pl-10 pr-10'} placeholder="Minimum 8 characters" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPw ? 'text' : 'password'} value={form.confirm} onChange={e => setForm(f => ({...f, confirm: e.target.value}))} className={inp + ' pl-10'} placeholder="Repeat password" required />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" />Activating...</> : '🚀 Activate Account & Start Learning'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function SetupAccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bloomy-50 via-white to-blue-50 flex flex-col">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <img src="/bloomy-logo.jpg" alt="Bloomy" className="w-8 h-8 object-cover rounded-lg" />
          <span className="font-bold text-gray-900">BloomyLMS</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-bloomy-600" /></div>}>
          <SetupForm />
        </Suspense>
      </div>
    </div>
  )
}
