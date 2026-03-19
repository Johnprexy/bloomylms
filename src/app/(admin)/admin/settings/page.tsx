'use client'

import { useState } from 'react'
import { Settings, Bell, Shield, Palette, Globe, Save, Loader2 } from 'lucide-react'

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    site_name: 'BloomyLMS',
    site_url: 'https://lms.bloomy360.com',
    support_email: 'support@bloomy360.com',
    enrollment_notifications: true,
    payment_notifications: true,
    certificate_auto_issue: true,
    maintenance_mode: false,
    registration_open: true,
    require_email_verification: true,
  })

  const update = (k: string, v: any) => setSettings(s => ({ ...s, [k]: v }))

  async function save() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const sections = [
    {
      icon: Globe,
      title: 'General',
      fields: [
        { key: 'site_name', label: 'Platform Name', type: 'text' },
        { key: 'site_url', label: 'Platform URL', type: 'text' },
        { key: 'support_email', label: 'Support Email', type: 'email' },
      ]
    },
    {
      icon: Bell,
      title: 'Notifications',
      toggles: [
        { key: 'enrollment_notifications', label: 'Enrollment Notifications', desc: 'Notify students when they enroll' },
        { key: 'payment_notifications', label: 'Payment Notifications', desc: 'Send payment confirmation emails' },
      ]
    },
    {
      icon: Shield,
      title: 'Access & Security',
      toggles: [
        { key: 'registration_open', label: 'Open Registration', desc: 'Allow new users to register' },
        { key: 'require_email_verification', label: 'Email Verification', desc: 'Require email verification on signup' },
        { key: 'maintenance_mode', label: 'Maintenance Mode', desc: 'Temporarily disable public access' },
      ]
    },
    {
      icon: Palette,
      title: 'Certificates',
      toggles: [
        { key: 'certificate_auto_issue', label: 'Auto-Issue Certificates', desc: 'Automatically generate certificates on course completion' },
      ]
    },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform configuration</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-3 rounded-xl">
          ✓ Settings saved successfully
        </div>
      )}

      {sections.map(section => (
        <div key={section.title} className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-bloomy-50 rounded-lg flex items-center justify-center">
              <section.icon className="w-4 h-4 text-bloomy-600" />
            </div>
            <h2 className="font-semibold text-gray-900">{section.title}</h2>
          </div>

          <div className="space-y-4">
            {section.fields?.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={(settings as any)[field.key]}
                  onChange={e => update(field.key, e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 focus:border-transparent"
                />
              </div>
            ))}

            {section.toggles?.map(toggle => (
              <label key={toggle.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-sm text-gray-900">{toggle.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{toggle.desc}</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={(settings as any)[toggle.key]}
                    onChange={e => update(toggle.key, e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    onClick={() => update(toggle.key, !(settings as any)[toggle.key])}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      (settings as any)[toggle.key] ? 'bg-bloomy-600' : 'bg-gray-200'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mt-0.5 ${
                      (settings as any)[toggle.key] ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
