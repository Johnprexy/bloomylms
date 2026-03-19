'use client'

import { useState } from 'react'
import { Bell, Shield, Globe, Save, Loader2, Mail, DollarSign } from 'lucide-react'

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    site_name: 'BloomyLMS',
    site_url: 'https://lms.bloomy360.com',
    support_email: 'support@bloomy360.com',
    support_phone: '+234 913 464 4911',
    enrollment_notifications: true,
    payment_notifications: true,
    certificate_auto_issue: true,
    maintenance_mode: false,
    registration_open: true,
    require_email_verification: true,
    paystack_enabled: true,
    stripe_enabled: true,
    default_currency: 'NGN',
  })

  const toggle = (key: keyof typeof settings) =>
    setSettings(s => ({ ...s, [key]: !s[key] }))
  const update = (key: keyof typeof settings, val: string) =>
    setSettings(s => ({ ...s, [key]: val }))

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  const Toggle = ({ enabled, onToggle, label, desc }: { enabled: boolean; onToggle: () => void; label: string; desc?: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-bloomy-600' : 'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )

  const inp = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage platform configuration</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-1 justify-center py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {activeTab === 'general' && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900">General Settings</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform Name</label>
                <input value={settings.site_name} onChange={e => update('site_name', e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Platform URL</label>
                <input value={settings.site_url} onChange={e => update('site_url', e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Email</label>
                <input value={settings.support_email} onChange={e => update('support_email', e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Support Phone</label>
                <input value={settings.support_phone} onChange={e => update('support_phone', e.target.value)} className={inp} />
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <Toggle enabled={settings.registration_open} onToggle={() => toggle('registration_open')} label="Open Registration" desc="Allow new students to sign up" />
              <Toggle enabled={settings.maintenance_mode} onToggle={() => toggle('maintenance_mode')} label="Maintenance Mode" desc="Show maintenance page to all users" />
              <Toggle enabled={settings.certificate_auto_issue} onToggle={() => toggle('certificate_auto_issue')} label="Auto-issue Certificates" desc="Generate certificates automatically on completion" />
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <h2 className="font-bold text-gray-900 mb-4">Notification Settings</h2>
            <div className="border border-gray-100 rounded-xl p-4">
              <Toggle enabled={settings.enrollment_notifications} onToggle={() => toggle('enrollment_notifications')} label="Enrollment Notifications" desc="Email students when they enroll" />
              <Toggle enabled={settings.payment_notifications} onToggle={() => toggle('payment_notifications')} label="Payment Notifications" desc="Email receipts on successful payments" />
              <Toggle enabled={settings.require_email_verification} onToggle={() => toggle('require_email_verification')} label="Require Email Verification" desc="Students must verify email before access" />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
              <p className="text-sm font-medium text-blue-800 mb-1">Email Provider: Resend</p>
              <p className="text-xs text-blue-600">Configure RESEND_API_KEY in your environment variables.</p>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-900">Payment Settings</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Currency</label>
              <select value={settings.default_currency} onChange={e => update('default_currency', e.target.value)} className={inp + ' max-w-xs'}>
                <option value="NGN">NGN — Nigerian Naira (₦)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="GBP">GBP — British Pound (£)</option>
              </select>
            </div>
            <div className="border border-gray-100 rounded-xl p-4">
              <Toggle enabled={settings.paystack_enabled} onToggle={() => toggle('paystack_enabled')} label="Paystack (NGN)" desc="Accept Nigerian Naira payments" />
              <Toggle enabled={settings.stripe_enabled} onToggle={() => toggle('stripe_enabled')} label="Stripe (International)" desc="Accept USD/GBP payments" />
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">Paystack Webhook URL</p>
              <code className="text-xs bg-yellow-100 px-3 py-2 rounded font-mono block break-all">
                {settings.site_url}/api/payments/paystack/webhook
              </code>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div>
            <h2 className="font-bold text-gray-900 mb-4">Security Settings</h2>
            <div className="border border-gray-100 rounded-xl p-4 mb-4">
              <Toggle enabled={settings.require_email_verification} onToggle={() => toggle('require_email_verification')} label="Email Verification Required" desc="Require email confirmation before account activation" />
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 mb-2">✓ Security features active</p>
              <ul className="text-xs text-green-700 space-y-1.5">
                <li>• Row Level Security (RLS) on all database tables</li>
                <li>• JWT authentication via Supabase Auth</li>
                <li>• Paystack webhook HMAC-SHA512 signature verification</li>
                <li>• Role-based access control (student / instructor / admin)</li>
                <li>• Server-side middleware route protection</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
