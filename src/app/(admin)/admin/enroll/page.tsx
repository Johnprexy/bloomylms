'use client'

import { useState, useEffect, useRef } from 'react'
import { UserPlus, Upload, Send, CheckCircle, Loader2, X, AlertCircle, Mail, BookOpen, Users, Clock, RefreshCw, Trash2 } from 'lucide-react'

type Invitation = {
  id: string; email: string; full_name: string; course_title: string;
  status: string; created_at: string; expires_at: string; accepted_at?: string
}

export default function EnrollPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'single' | 'bulk'>('single')
  const [sending, setSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Single enrollment
  const [form, setForm] = useState({ email: '', full_name: '', course_id: '', notes: '' })

  // Bulk enrollment
  const [bulkRows, setBulkRows] = useState<{ email: string; full_name: string; course_id: string }[]>([
    { email: '', full_name: '', course_id: '' }
  ])
  const [bulkText, setBulkText] = useState('')
  const [bulkMode, setBulkMode] = useState<'table' | 'paste'>('table')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/course-builder').then(r => r.json()),
      fetch('/api/admin/invitations').then(r => r.json()),
    ]).then(([crs, inv]) => {
      setCourses(crs.data || [])
      setInvitations(inv.data || [])
      setLoading(false)
    })
  }, [])

  async function refreshInvitations() {
    const d = await fetch('/api/admin/invitations').then(r => r.json())
    setInvitations(d.data || [])
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg); setErrorMsg('')
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  function showError(msg: string) {
    setErrorMsg(msg); setSuccessMsg('')
    setTimeout(() => setErrorMsg(''), 6000)
  }

  async function sendSingle() {
    if (!form.email || !form.course_id) { showError('Email and course are required'); return }
    setSending(true)
    const res = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ email: form.email.toLowerCase().trim(), full_name: form.full_name.trim(), course_id: form.course_id }]),
    }).then(r => r.json())
    setSending(false)
    if (res.error) { showError(res.error); return }
    showSuccess(`Invitation sent to ${form.email}`)
    setForm({ email: '', full_name: '', course_id: '', notes: '' })
    refreshInvitations()
  }

  async function sendBulk() {
    let rows: { email: string; full_name: string; course_id: string }[] = []

    if (bulkMode === 'paste') {
      // Parse CSV: email, name, course_id or just email
      const lines = bulkText.trim().split('\n').filter(Boolean)
      const defaultCourse = courses[0]?.id || ''
      rows = lines.map(line => {
        const [email, full_name, course_id] = line.split(',').map(s => s.trim())
        return { email: email?.toLowerCase() || '', full_name: full_name || '', course_id: course_id || defaultCourse }
      }).filter(r => r.email)
    } else {
      rows = bulkRows.filter(r => r.email && r.course_id)
    }

    if (rows.length === 0) { showError('No valid rows to enroll'); return }
    setSending(true)
    const res = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rows),
    }).then(r => r.json())
    setSending(false)
    if (res.error) { showError(res.error); return }
    showSuccess(`${res.data.sent} invitation${res.data.sent !== 1 ? 's' : ''} sent! ${res.data.skipped > 0 ? `(${res.data.skipped} already active, skipped)` : ''}`)
    setBulkRows([{ email: '', full_name: '', course_id: '' }])
    setBulkText('')
    refreshInvitations()
  }

  async function resendInvitation(id: string) {
    await fetch(`/api/admin/invitations?id=${id}`, { method: 'PATCH' })
    showSuccess('Invitation resent!')
    refreshInvitations()
  }

  async function deleteInvitation(id: string) {
    await fetch(`/api/admin/invitations?id=${id}`, { method: 'DELETE' })
    refreshInvitations()
  }

  function parseCSVFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n').slice(1) // skip header
      const defaultCourse = courses[0]?.id || ''
      const parsed = lines.map(line => {
        const [email, full_name, course_id] = line.split(',').map(s => s.replace(/"/g, '').trim())
        return { email: email?.toLowerCase() || '', full_name: full_name || '', course_id: course_id || defaultCourse }
      }).filter(r => r.email)
      setBulkRows(parsed.length ? parsed : [{ email: '', full_name: '', course_id: '' }])
      setBulkMode('table')
    }
    reader.readAsText(file)
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500'
  const statusColor = (s: string) => s === 'accepted' ? 'bg-green-50 text-green-700' : s === 'expired' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-50 text-yellow-700'
  const pending = invitations.filter(i => i.status === 'pending').length
  const accepted = invitations.filter(i => i.status === 'accepted').length

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Enrollment</h1>
        <p className="text-sm text-gray-500 mt-1">Manually enroll students by email — they'll receive a setup link to create their password and access their course</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Invitations', value: invitations.length, icon: Mail, color: 'bg-blue-50 text-blue-600' },
          { label: 'Awaiting Setup', value: pending, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Active Students', value: accepted, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {successMsg && <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100 text-sm font-medium"><CheckCircle className="w-4 h-4 flex-shrink-0" />{successMsg}</div>}
      {errorMsg && <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{errorMsg}</div>}

      {/* Enrollment Form */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[['single','Single Student'],['bulk','Bulk Upload']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as any)} className={`flex-1 py-3.5 text-sm font-medium transition-colors ${tab === id ? 'bg-bloomy-50 text-bloomy-700 border-b-2 border-bloomy-500' : 'text-gray-500 hover:text-gray-700'}`}>
              {id === 'single' ? <UserPlus className="w-4 h-4 inline mr-2" /> : <Upload className="w-4 h-4 inline mr-2" />}{label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'single' && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={inp} placeholder="student@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} className={inp} placeholder="John Doe" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to Course *</label>
                  <select value={form.course_id} onChange={e => setForm(f => ({...f, course_id: e.target.value}))} className={inp}>
                    <option value="">Select course...</option>
                    {courses.filter(c => c.status !== 'archived').map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>The student will receive an email with a link to set their password and activate their account. They'll be automatically enrolled in the selected course.</p>
              </div>
              <button onClick={sendSingle} disabled={sending || !form.email || !form.course_id} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send Invitation
              </button>
            </div>
          )}

          {tab === 'bulk' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {[['table','Row by row'],['paste','Paste CSV']].map(([id, label]) => (
                    <button key={id} onClick={() => setBulkMode(id as any)} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${bulkMode === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{label}</button>
                  ))}
                </div>
                <button onClick={() => fileRef.current?.click()} className="btn-secondary text-xs flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" />Upload CSV</button>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && parseCSVFile(e.target.files[0])} />
                <a href="data:text/csv;charset=utf-8,email%2Cfull_name%2Ccourse_id%0Ajohn%40example.com%2CJohn%20Doe%2C" download="bloomy_enrollment_template.csv" className="text-xs text-bloomy-600 underline">Download CSV template</a>
              </div>

              {bulkMode === 'table' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-1">
                    <div className="col-span-4">Email *</div>
                    <div className="col-span-3">Full Name</div>
                    <div className="col-span-4">Course *</div>
                    <div className="col-span-1" />
                  </div>
                  {bulkRows.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={row.email} onChange={e => setBulkRows(r => r.map((x, j) => j === i ? {...x, email: e.target.value} : x))} className={inp + ' col-span-4 text-xs py-2'} placeholder="email@..." />
                      <input value={row.full_name} onChange={e => setBulkRows(r => r.map((x, j) => j === i ? {...x, full_name: e.target.value} : x))} className={inp + ' col-span-3 text-xs py-2'} placeholder="Full name" />
                      <select value={row.course_id} onChange={e => setBulkRows(r => r.map((x, j) => j === i ? {...x, course_id: e.target.value} : x))} className={inp + ' col-span-4 text-xs py-2'}>
                        <option value="">Select course</option>
                        {courses.filter(c => c.status !== 'archived').map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                      </select>
                      {bulkRows.length > 1 && <button onClick={() => setBulkRows(r => r.filter((_, j) => j !== i))} className="col-span-1 text-gray-300 hover:text-red-400 flex justify-center"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setBulkRows(r => [...r, { email: '', full_name: '', course_id: '' }])} className="text-sm text-bloomy-600 flex items-center gap-1.5 mt-1"><UserPlus className="w-3.5 h-3.5" />Add row</button>
                </div>
              )}

              {bulkMode === 'paste' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Paste CSV data (email, name, course_id — one per line)</label>
                  <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8} className={inp + ' resize-none font-mono text-xs'} placeholder={'john@example.com, John Doe, course-id-here\njane@example.com, Jane Smith, course-id-here'} />
                </div>
              )}

              <button onClick={sendBulk} disabled={sending} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send {bulkMode === 'table' ? bulkRows.filter(r => r.email && r.course_id).length : bulkText.trim().split('\n').filter(Boolean).length} Invitations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invitations List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">All Invitations</h2>
          <button onClick={refreshInvitations} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-bloomy-500" /></div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-12"><Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" /><p className="text-gray-400 text-sm">No invitations sent yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-50">
                {['Student','Course','Status','Invited','Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {invitations.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-sm text-gray-900">{inv.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">{inv.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 max-w-[180px] truncate">{inv.course_title || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColor(inv.status)}`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {inv.status !== 'accepted' && (
                          <button onClick={() => resendInvitation(inv.id)} className="text-xs text-bloomy-600 hover:text-bloomy-700 font-medium px-2 py-1 rounded-lg hover:bg-bloomy-50 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />Resend
                          </button>
                        )}
                        <button onClick={() => deleteInvitation(inv.id)} className="text-gray-300 hover:text-red-400 p-1 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
