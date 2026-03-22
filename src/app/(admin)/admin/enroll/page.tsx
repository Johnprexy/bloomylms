'use client'

import { useState, useEffect, useRef } from 'react'
import { UserPlus, Upload, CheckCircle, Loader2, X, AlertCircle, Mail, Users, Clock, RefreshCw, Trash2, Plus, Copy, Eye, EyeOff } from 'lucide-react'

export default function EnrollPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [cohorts, setCohorts] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Single
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [courseId, setCourseId] = useState('')

  // Bulk table
  const [bulkRows, setBulkRows] = useState([{ email: '', full_name: '', phone: '', cohort_id: '', course_id: '' }])

  // Bulk CSV paste
  const [bulkText, setBulkText] = useState('')
  const [tab, setTab] = useState<'single' | 'bulk' | 'csv'>('single')

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/course-builder').then(r => r.json()),
      fetch('/api/admin/invitations').then(r => r.json()),
      fetch('/api/admin/cohorts-full').then(r => r.json()).catch(() => ({ cohorts: [] })),
    ]).then(([crs, inv, coh]) => {
      setCourses(crs.data || [])
      setInvitations(inv.data || [])
      setCohorts(coh.cohorts || [])
      setLoading(false)
    })
  }, [])

  async function enroll(rows: { email: string; full_name?: string; course_id: string }[]) {
    const valid = rows.filter(r => r.email?.trim() && r.course_id)
    if (!valid.length) { setErrorMsg('Fill in email and select a course'); return }
    setSending(true)
    setResults([])
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valid),
      }).then(r => r.json())

      setSending(false)
      if (res.error) { setErrorMsg(res.error); return }
      setResults(res.data?.results || [])
      // Reset form
      setEmail(''); setName(''); setCourseId('')
      setBulkRows([{ email: '', full_name: '', phone: '', cohort_id: '', course_id: '' }])
      setBulkText('')
      // Refresh invitations
      const inv = await fetch('/api/admin/invitations').then(r => r.json())
      setInvitations(inv.data || [])
    } catch (e: any) {
      setSending(false)
      setErrorMsg('Network error: ' + e.message)
    }
  }

  function parseBulkText() {
    const lines = bulkText.trim().split('\n').filter(Boolean)
    return lines.map(line => {
      const parts = line.split(',').map(s => s.trim())
      return { email: parts[0]?.toLowerCase() || '', full_name: parts[1] || '', phone: parts[2] || '', cohort_id: parts[3] || '', course_id: parts[4] || courseId || '' }
    }).filter(r => r.email)
  }

  function parseCSVFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const lines = text.trim().split('\n').slice(1)
      const parsed = lines.map(line => {
        const [em, fn, phone, cohort_id, cid] = line.split(',').map(s => s.replace(/"/g, '').trim())
        return { email: em?.toLowerCase() || '', full_name: fn || '', phone: phone || '', cohort_id: cohort_id || '', course_id: cid || courseId || '' }
      }).filter(r => r.email)
      if (parsed.length) { setBulkRows(parsed); setTab('bulk') }
    }
    reader.readAsText(file)
  }

  async function deleteInvitation(id: string) {
    await fetch(`/api/admin/invitations?id=${id}`, { method: 'DELETE' })
    setInvitations(inv => inv.filter(i => i.id !== id))
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
  }

  const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500 bg-white'
  const pending  = invitations.filter(i => i.status === 'pending').length
  const accepted = invitations.filter(i => i.status === 'accepted').length

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enroll Students</h1>
        <p className="text-sm text-gray-500 mt-0.5">Add students directly — new accounts are created instantly with a temporary password</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Enrollments', value: invitations.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Pending Setup', value: pending, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Active', value: accepted, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Enroll form */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[['single','Single Student'],['bulk','Bulk (Table)'],['csv','Paste CSV']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-bloomy-500 text-bloomy-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* SINGLE */}
          {tab === 'single' && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student Email *</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className={inp}
                  placeholder="student@email.com" type="email"
                  onKeyDown={e => e.key === 'Enter' && enroll([{ email, full_name: name, course_id: courseId }])} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className={inp} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course *</label>
                <select value={courseId} onChange={e => setCourseId(e.target.value)} className={inp + ' appearance-none cursor-pointer'}>
                  <option value="">Select course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>How it works:</strong> If the student already has an account, they're enrolled immediately.
                  If not, a new account is created with a temporary password — you'll see it in the results below to share with them.
                </div>
              </div>
              <button onClick={() => enroll([{ email, full_name: name, course_id: courseId }])}
                disabled={sending || !email || !courseId}
                className="btn-primary flex items-center gap-2 text-sm w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Enrolling...</> : <><UserPlus className="w-4 h-4" />Enroll Student</>}
              </button>
            </div>
          )}

          {/* BULK TABLE */}
          {tab === 'bulk' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{bulkRows.length} student{bulkRows.length !== 1 ? 's' : ''}</p>
                <div className="flex gap-2">
                  <label className="btn-secondary text-sm py-1.5 cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />Upload CSV
                    <input type="file" accept=".csv" ref={fileRef} className="hidden" onChange={e => e.target.files?.[0] && parseCSVFile(e.target.files[0])} />
                  </label>
                  <button onClick={() => setBulkRows(r => [...r, { email: '', full_name: '', phone: '', cohort_id: '', course_id: '' }])}
                    className="btn-secondary text-sm py-1.5 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />Add Row
                  </button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-gray-50 border-b border-gray-100">
                    {['Email *', 'Full Name', 'Phone', 'Cohort', 'Course *', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {bulkRows.map((row, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5">
                          <input value={row.email} onChange={e => setBulkRows(rows => rows.map((r, j) => j === i ? { ...r, email: e.target.value } : r))}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-bloomy-500"
                            placeholder="email@example.com" type="email" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={row.full_name} onChange={e => setBulkRows(rows => rows.map((r, j) => j === i ? { ...r, full_name: e.target.value } : r))}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-bloomy-500"
                            placeholder="Full name" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input value={row.phone || ''} onChange={e => setBulkRows(rows => rows.map((r, j) => j === i ? { ...r, phone: e.target.value } : r))}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-bloomy-500"
                            placeholder="+234..." />
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={row.cohort_id || ''} onChange={e => setBulkRows(rows => rows.map((r, j) => j === i ? { ...r, cohort_id: e.target.value } : r))}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-bloomy-500 bg-white">
                            <option value="">No cohort</option>
                            {cohorts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={row.course_id} onChange={e => setBulkRows(rows => rows.map((r, j) => j === i ? { ...r, course_id: e.target.value } : r))}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-bloomy-500 bg-white">
                            <option value="">Select...</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          {bulkRows.length > 1 && (
                            <button onClick={() => setBulkRows(r => r.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 p-1">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => enroll(bulkRows)} disabled={sending}
                className="btn-primary flex items-center gap-2 text-sm py-3 w-full justify-center disabled:opacity-50">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Enrolling {bulkRows.filter(r=>r.email&&r.course_id).length} students...</> : <><Users className="w-4 h-4" />Enroll {bulkRows.filter(r=>r.email&&r.course_id).length} Students</>}
              </button>
            </div>
          )}

          {/* CSV PASTE */}
          {tab === 'csv' && (
            <div className="space-y-3 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Paste CSV Data</label>
                <p className="text-xs text-gray-400 mb-2">Format: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">email, full name, phone, cohort_id, course_id</code> — one per line.</p>
                <div className="mb-2">
                  <select value={courseId} onChange={e => setCourseId(e.target.value)} className={inp + ' appearance-none'}>
                    <option value="">Default course (optional)...</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
                  rows={8} className={inp + ' font-mono resize-none'}
                  placeholder={`john@email.com, John Doe\njane@email.com, Jane Smith\nmark@email.com, Mark Brown`} />
              </div>
              <p className="text-xs text-gray-400">{parseBulkText().length} valid rows detected</p>
              <button onClick={() => enroll(parseBulkText())} disabled={sending || parseBulkText().length === 0}
                className="btn-primary flex items-center gap-2 text-sm py-3 w-full justify-center disabled:opacity-50">
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Enrolling...</> : <><Users className="w-4 h-4" />Enroll {parseBulkText().length} Students</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Enrollment Results</h2>
            <div className="flex gap-3 text-xs">
              {[
                ['enrolled', 'text-green-600'], ['created', 'text-blue-600'],
                ['skipped', 'text-yellow-600'], ['error', 'text-red-600'],
              ].map(([s, c]) => {
                const n = results.filter(r => r.status === s).length
                return n > 0 ? <span key={s} className={`font-semibold ${c}`}>{n} {s}</span> : null
              })}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${r.status === 'error' ? 'bg-red-50' : r.status === 'skipped' ? 'bg-gray-50' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${
                  r.status === 'enrolled' ? 'bg-green-100' : r.status === 'created' ? 'bg-blue-100' :
                  r.status === 'skipped' ? 'bg-gray-100' : 'bg-red-100'
                }`}>
                  {r.status === 'enrolled' ? '✓' : r.status === 'created' ? '★' : r.status === 'skipped' ? '–' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.email}</p>
                  <p className="text-xs text-gray-500">{r.message}</p>
                </div>
                {/* Show temp password with copy button */}
                {r.status === 'created' && r.message.includes('Temp password:') && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                      <span className={`font-mono text-sm font-bold text-blue-800 ${showPasswords[r.email] ? '' : 'blur-sm select-none'}`}>
                        {r.message.split('Temp password: ')[1]}
                      </span>
                      <button onClick={() => setShowPasswords(p => ({ ...p, [r.email]: !p[r.email] }))} className="text-blue-400 hover:text-blue-600">
                        {showPasswords[r.email] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => copyToClipboard(r.message.split('Temp password: ')[1])} className="text-blue-400 hover:text-blue-600" title="Copy password">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {results.some(r => r.status === 'created') && (
            <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
              <p className="text-xs text-blue-700 font-medium">⚠ Share the temporary passwords above with new students. They can change it from their Profile page after logging in.</p>
            </div>
          )}
        </div>
      )}

      {/* All enrollments */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">All Enrollments ({invitations.length})</h2>
          <button onClick={async () => { const d = await fetch('/api/admin/invitations').then(r=>r.json()); setInvitations(d.data||[]) }}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {invitations.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No enrollments yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                {['Student', 'Course', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {invitations.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{inv.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">{inv.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-48 truncate">{inv.course_title || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        inv.status === 'accepted' ? 'bg-green-50 text-green-700' :
                        inv.status === 'expired'  ? 'bg-gray-100 text-gray-500'  :
                        'bg-yellow-50 text-yellow-700'}`}>
                        {inv.status === 'accepted' ? '✓ Active' : inv.status === 'pending' ? 'Pending' : inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteInvitation(inv.id)} className="text-gray-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
