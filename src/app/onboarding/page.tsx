'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'

const INTERESTS = [
  { id: 'linux-devops', label: 'Linux & DevOps', icon: '☁️' },
  { id: 'cybersecurity', label: 'Cybersecurity', icon: '🔒' },
  { id: 'data-analysis', label: 'Data Analysis', icon: '📊' },
  { id: 'web-development', label: 'Web Development', icon: '💻' },
  { id: 'cloud-computing', label: 'Cloud Computing', icon: '🌐' },
  { id: 'product-management', label: 'Product Management', icon: '🎯' },
]

const EXPERIENCE_LEVELS = [
  { value: 'complete-beginner', label: 'Complete Beginner', desc: 'No tech background at all' },
  { value: 'some-experience', label: 'Some Experience', desc: 'Familiar with basics' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Working in tech already' },
  { value: 'experienced', label: 'Experienced', desc: 'Looking to level up' },
]

const GOALS = [
  { value: 'new-career', label: '💼 Land a new tech job' },
  { value: 'upskill', label: '📈 Upskill in current role' },
  { value: 'freelance', label: '🌍 Start freelancing' },
  { value: 'certification', label: '🏆 Get certified' },
  { value: 'personal', label: '🧠 Personal growth' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    location: '',
    interests: [] as string[],
    experience: '',
    goal: '',
  })

  const toggleInterest = (id: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(id) ? f.interests.filter(i => i !== id) : [...f.interests, id]
    }))
  }

  const canNext = () => {
    if (step === 1) return form.full_name.trim().length > 0
    if (step === 2) return form.interests.length > 0
    if (step === 3) return form.experience !== ''
    return true
  }

  async function finish() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
      location: form.location,
      onboarding_completed: true,
    }).eq('id', user.id)

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bloomy-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-bloomy-600 w-12' : 'bg-gray-200 w-8'}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">

          {/* Step 1 — Personal info */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bloomy-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👋</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome to BloomyLMS!</h1>
                <p className="text-gray-500 text-sm mt-2">Let's personalize your experience. Just takes 1 minute.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">What's your full name? *</label>
                  <input
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="John Doe"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+234 xxx xxx xxxx"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Where are you based?</label>
                  <input
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Lagos, Nigeria"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Interests */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">What do you want to learn?</h2>
                <p className="text-gray-500 text-sm mt-1">Pick one or more (you can change later)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {INTERESTS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      form.interests.includes(item.id)
                        ? 'border-bloomy-500 bg-bloomy-50'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className={`text-sm font-medium ${form.interests.includes(item.id) ? 'text-bloomy-700' : 'text-gray-700'}`}>
                        {item.label}
                      </p>
                      {form.interests.includes(item.id) && (
                        <CheckCircle className="w-3.5 h-3.5 text-bloomy-500 mt-0.5" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Experience */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your experience level?</h2>
                <p className="text-gray-500 text-sm mt-1">This helps us recommend the right courses</p>
              </div>
              <div className="space-y-3">
                {EXPERIENCE_LEVELS.map(level => (
                  <button
                    key={level.value}
                    onClick={() => setForm(f => ({ ...f, experience: level.value }))}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      form.experience === level.value
                        ? 'border-bloomy-500 bg-bloomy-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      form.experience === level.value ? 'border-bloomy-500 bg-bloomy-500' : 'border-gray-300'
                    }`}>
                      {form.experience === level.value && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{level.label}</p>
                      <p className="text-xs text-gray-400">{level.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — Goal */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">What's your main goal?</h2>
                <p className="text-gray-500 text-sm mt-1">We'll tailor your learning path</p>
              </div>
              <div className="space-y-2">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setForm(f => ({ ...f, goal: g.value }))}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all text-sm font-medium ${
                      form.goal === g.value
                        ? 'border-bloomy-500 bg-bloomy-50 text-bloomy-800'
                        : 'border-gray-100 hover:border-gray-200 text-gray-700'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-2 text-sm">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={loading}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🚀'}
                {loading ? 'Setting up...' : 'Start Learning!'}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <button onClick={() => router.push('/dashboard')} className="hover:text-gray-600 transition-colors">
            Skip for now →
          </button>
        </p>
      </div>
    </div>
  )
}
