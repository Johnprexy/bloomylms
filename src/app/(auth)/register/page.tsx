'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle } from 'lucide-react'
import { signUp } from '@/lib/actions/auth'

const COURSES = ['Linux, DevOps & Cloud', 'Cybersecurity & Ethical Hacking', 'Data Analysis', 'Full-Stack Web Development', 'Cloud Computing', 'Product Management']

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', course_interest: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const strength = () => {
    const p = form.password
    if (p.length < 6) return { score: 0, label: '', color: '' }
    if (p.length < 8) return { score: 1, label: 'Weak', color: 'bg-red-400' }
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(p)) return { score: 3, label: 'Strong', color: 'bg-green-500' }
    return { score: 2, label: 'Good', color: 'bg-yellow-400' }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')

    const result = await signUp({ email: form.email, password: form.password, full_name: form.full_name })

    if (result.error) { setError(result.error); setLoading(false); return }

    // Auto sign in after registration
    const signInResult = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)
    if (signInResult?.ok) {
      router.push('/onboarding')
    } else {
      setSuccess(true)
    }
  }

  const { score, label, color } = strength()

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500 text-sm mb-6">Your account is ready. Sign in to start learning.</p>
          <Link href="/login" className="btn-primary w-full flex items-center justify-center">Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
          <p className="text-gray-500 text-sm">Join 1,000+ students on their tech journey</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 border border-red-100">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)}
                placeholder="John Doe" required className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="you@example.com" required className="input-field pl-10" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={e => update('password', e.target.value)} placeholder="Min. 8 characters"
                required className="input-field pl-10 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? color : 'bg-gray-200'}`} />)}
                </div>
                {label && <p className="text-xs text-gray-500">Strength: <span className="font-medium">{label}</span></p>}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Course interest <span className="text-gray-400 font-normal">(optional)</span></label>
            <select value={form.course_interest} onChange={e => update('course_interest', e.target.value)} className="input-field">
              <option value="">Select a course...</option>
              {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-bloomy-600 font-medium hover:text-bloomy-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
