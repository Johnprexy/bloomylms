'use client'
import { useState, useEffect, useCallback } from 'react'
import { Download, Loader2, ChevronDown, Save, Filter, BarChart2, Users, BookOpen, Star, FileText } from 'lucide-react'

const CATEGORIES = [
  { value: 'attendance', label: 'Attendance', color: '#3b82f6' },
  { value: 'assignment', label: 'Assignment', color: '#f97316' },
  { value: 'quiz',       label: 'Quiz',       color: '#8b5cf6' },
  { value: 'midterm',    label: 'Mid-term',   color: '#eab308' },
  { value: 'final',      label: 'Final Exam', color: '#ef4444' },
  { value: 'project',    label: 'Project',    color: '#10b981' },
]

const GRADE_COLORS: Record<string, string> = { A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }

export default function GradebookPage() {
  const [cohorts, setCohorts]   = useState<any[]>([])
  const [courses, setCourses]   = useState<any[]>([])
  const [items, setItems]       = useState<any[]>([])
  const [data, setData]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [savedAt, setSavedAt]   = useState<string>('')
  const [localGrades, setLocalGrades] = useState<Record<string, Record<string, string>>>({})
  const [view, setView]         = useState<'dashboard' | 'student'>('dashboard')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  // Filters
  const [filterCohort, setFilterCohort] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterStudent, setFilterStudent] = useState('')

  // Unique cohorts
  const uniqueCohorts = Array.from(new Map(cohorts.map((c: any) => [c.id, c])).values())
  const cohortCourses = filterCohort ? cohorts.filter((c: any) => c.id === filterCohort) : []

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCohort) params.set('cohort_id', filterCohort)
    if (filterCourse) params.set('course_id', filterCourse)
    if (filterStudent) params.set('student_id', filterStudent)
    const d = await fetch(`/api/admin/gradebook-full?${params}`).then(r => r.json())
    setCohorts(d.cohorts || [])
    setCourses(d.courses || [])
    setItems(d.items || [])
    setData(d.data || [])
    // Init local grades from loaded data
    const lg: Record<string, Record<string, string>> = {}
    d.data?.forEach((row: any) => {
      lg[row.student.id] = {}
      Object.entries(row.grades || {}).forEach(([itemId, score]: any) => {
        if (score !== null && score !== undefined) lg[row.student.id][itemId] = String(score)
      })
    })
    setLocalGrades(lg)
    setLoading(false)
  }, [filterCohort, filterCourse, filterStudent])

  useEffect(() => { load() }, [load])

  async function saveGrades() {
    setSaving(true)
    const payload: any[] = []
    Object.entries(localGrades).forEach(([studentId, grades]) => {
      Object.entries(grades).forEach(([itemId, score]) => {
        if (score !== '') payload.push({ student_id: studentId, grade_item_id: itemId, score: parseFloat(score) })
      })
    })
    await fetch('/api/admin/gradebook-full', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grades: payload }),
    })
    setSaving(false)
    setSavedAt(new Date().toLocaleTimeString())
    await load()
  }

  function setGrade(studentId: string, itemId: string, val: string) {
    setLocalGrades(g => ({ ...g, [studentId]: { ...(g[studentId] || {}), [itemId]: val } }))
  }

  // Export CSV
  function exportCSV() {
    const catCols = [...new Set(items.map(i => i.category))]
    const header = ['Student', 'Email', ...items.map(i => `${i.title} (/${i.max_score})`), ...catCols.map(c => `${c} Avg %`), 'Final Score', 'Grade']
    const rows = data.map(row => [
      row.student.full_name, row.student.email,
      ...items.map(i => localGrades[row.student.id]?.[i.id] ?? (row.grades[i.id] !== null ? row.grades[i.id] : '')),
      ...catCols.map(c => row.categoryAvg[c] !== null ? row.categoryAvg[c] + '%' : ''),
      row.finalScore !== null ? row.finalScore + '%' : '',
      row.letterGrade || '',
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'gradebook.csv'; a.click()
  }

  // Class averages
  const classAvgFinal = data.length > 0
    ? (data.filter(r => r.finalScore !== null).reduce((s, r) => s + r.finalScore, 0) / data.filter(r => r.finalScore !== null).length).toFixed(1)
    : null

  const sel = (
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
  )
  const selClass = "appearance-none w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-bloomy-500 cursor-pointer"

  return (
    <div className="max-w-full mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-sm text-gray-500 mt-0.5">Grades, attendance, quizzes and exams — all in one view</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {savedAt && <span className="text-xs text-green-600">✓ Saved {savedAt}</span>}
          <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-1.5 py-2">
            <Download className="w-3.5 h-3.5" />Export CSV
          </button>
          <button onClick={saveGrades} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5 py-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filter Gradebook</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Cohort</label>
            <select value={filterCohort} onChange={e => { setFilterCohort(e.target.value); setFilterCourse('') }} className={selClass}>
              <option value="">All Cohorts</option>
              {uniqueCohorts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>{sel}
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Course</label>
            <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className={selClass}>
              <option value="">All Courses</option>
              {(filterCohort ? cohortCourses : courses).map((c: any) => (
                <option key={c.course_id || c.id} value={c.course_id || c.id}>{c.course_title || c.title}</option>
              ))}
            </select>{sel}
          </div>
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Student</label>
            <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} className={selClass}>
              <option value="">All Students</option>
              {data.map((row: any) => <option key={row.student.id} value={row.student.id}>{row.student.full_name}</option>)}
            </select>{sel}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, label: 'Students', value: data.length },
            { icon: BookOpen, label: 'Grade Items', value: items.length },
            { icon: BarChart2, label: 'Class Average', value: classAvgFinal ? classAvgFinal + '%' : '—' },
            { icon: Star, label: 'Passing (≥70%)', value: data.filter(r => r.finalScore !== null && r.finalScore >= 70).length + '/' + data.filter(r => r.finalScore !== null).length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-4 h-4 text-bloomy-500" />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* View toggle */}
      {data.length > 0 && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {[['dashboard', 'Dashboard'], ['student', 'Per Student']].map(([id, label]) => (
            <button key={id} onClick={() => setView(id as any)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${view === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-bloomy-500" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <BarChart2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No data yet</p>
          <p className="text-sm text-gray-400">Select a cohort and course above to load the gradebook</p>
        </div>
      ) : view === 'dashboard' ? (
        /* DASHBOARD VIEW — spreadsheet */
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: Math.max(700, 220 + items.length * 100 + 160) }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-white border-b border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase" style={{ minWidth: 200 }}>
                    Student
                  </th>
                  {items.map(item => {
                    const cat = CATEGORIES.find(c => c.value === item.category)
                    return (
                      <th key={item.id} className="border-b border-r border-gray-100 px-2 py-2 text-center" style={{ minWidth: 90, background: cat?.color + '15' }}>
                        <div className="text-xs font-semibold truncate" style={{ color: cat?.color }} title={item.title}>{item.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{item.category} / {item.max_score}</div>
                      </th>
                    )
                  })}
                  {/* Category averages */}
                  {[...new Set(items.map((i: any) => i.category))].map(cat => (
                    <th key={String(cat)} className="border-b border-r border-gray-100 px-2 py-2 text-center bg-gray-50" style={{ minWidth: 80 }}>
                      <div className="text-xs font-semibold text-gray-600 capitalize">{String(cat)}</div>
                      <div className="text-xs text-gray-400">Avg %</div>
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 bg-gray-800 border-b border-gray-700 px-3 py-2 text-center" style={{ minWidth: 80 }}>
                    <div className="text-xs font-bold text-white">Final</div>
                    <div className="text-xs text-gray-400">Grade</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, si) => (
                  <tr key={row.student.id} className={`hover:bg-gray-50 ${si % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="sticky left-0 z-10 border-r border-gray-100 px-4 py-2.5" style={{ background: si % 2 === 0 ? 'white' : '#fafafa' }}>
                      <button onClick={() => { setSelectedStudent(row); setView('student') }} className="flex items-center gap-2.5 hover:text-bloomy-700 text-left">
                        <div className="w-7 h-7 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {row.student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-32">{row.student.full_name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-32">{row.student.email}</p>
                        </div>
                      </button>
                    </td>
                    {items.map(item => {
                      const val = localGrades[row.student.id]?.[item.id] ?? (row.grades[item.id] !== null ? String(row.grades[item.id]) : '')
                      const pct = val ? (parseFloat(val) / Number(item.max_score)) * 100 : null
                      const bg = pct !== null ? (pct >= 70 ? '#dcfce7' : pct >= 50 ? '#fef9c3' : '#fee2e2') : 'transparent'
                      return (
                        <td key={item.id} className="border-r border-gray-100 p-0 text-center" style={{ background: bg }}>
                          <input type="number" value={val} onChange={e => setGrade(row.student.id, item.id, e.target.value)}
                            className="w-full h-full px-1 py-2.5 text-sm text-center font-semibold bg-transparent border-0 focus:outline-none focus:bg-bloomy-50 focus:ring-1 focus:ring-bloomy-400"
                            min={0} max={item.max_score} placeholder="—" style={{ minHeight: 44 }} />
                        </td>
                      )
                    })}
                    {/* Category averages */}
                    {[...new Set(items.map((i: any) => i.category))].map(cat => {
                      const avg = row.categoryAvg[String(cat)]
                      return (
                        <td key={String(cat)} className="border-r border-gray-100 px-2 py-2.5 text-center bg-gray-50/50">
                          <span className="text-xs font-semibold text-gray-700">{avg !== null && avg !== undefined ? avg + '%' : '—'}</span>
                        </td>
                      )
                    })}
                    <td className="sticky right-0 z-10 px-3 py-2.5 text-center bg-gray-800">
                      {row.finalScore !== null ? (
                        <div>
                          <div className="text-sm font-bold" style={{ color: GRADE_COLORS[row.letterGrade || 'F'] || '#fff' }}>
                            {row.letterGrade}
                          </div>
                          <div className="text-xs text-gray-400">{row.finalScore}%</div>
                        </div>
                      ) : <span className="text-gray-500 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
                {/* Class average footer */}
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td className="sticky left-0 z-10 bg-gray-100 border-r border-gray-200 px-4 py-3">
                    <span className="text-xs font-bold text-gray-700 uppercase">Class Average</span>
                  </td>
                  {items.map(item => {
                    const scores = data.map(r => parseFloat(localGrades[r.student.id]?.[item.id] || '') || r.grades[item.id]).filter(v => v !== null && !isNaN(v))
                    const avg = scores.length > 0 ? (scores.reduce((s: number, v: any) => s + Number(v), 0) / scores.length).toFixed(1) : null
                    return (
                      <td key={item.id} className="border-r border-gray-200 px-2 py-3 text-center">
                        <span className="text-xs font-bold text-gray-700">{avg ?? '—'}</span>
                      </td>
                    )
                  })}
                  {[...new Set(items.map((i: any) => i.category))].map(cat => {
                    const avgs = data.map(r => r.categoryAvg[String(cat)]).filter(v => v !== null)
                    const avg = avgs.length > 0 ? (avgs.reduce((s: number, v: number) => s + v, 0) / avgs.length).toFixed(1) : null
                    return (
                      <td key={String(cat)} className="border-r border-gray-200 px-2 py-3 text-center bg-gray-100">
                        <span className="text-xs font-bold text-gray-700">{avg ? avg + '%' : '—'}</span>
                      </td>
                    )
                  })}
                  <td className="sticky right-0 bg-gray-800 px-3 py-3 text-center">
                    <span className="text-sm font-bold text-white">{classAvgFinal ? classAvgFinal + '%' : '—'}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* PER-STUDENT VIEW */
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {data.map(row => (
              <button key={row.student.id} onClick={() => setSelectedStudent(row)}
                className={`text-sm px-3 py-1.5 rounded-xl font-medium border transition-all ${selectedStudent?.student.id === row.student.id ? 'bg-bloomy-600 text-white border-bloomy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {row.student.full_name.split(' ')[0]}
              </button>
            ))}
          </div>

          {selectedStudent && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Student header */}
              <div className="bg-gradient-to-r from-bloomy-600 to-blue-600 px-6 py-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {selectedStudent.student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h2 className="text-white font-bold text-lg">{selectedStudent.student.full_name}</h2>
                  <p className="text-white/60 text-sm">{selectedStudent.student.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold" style={{ color: GRADE_COLORS[selectedStudent.letterGrade || 'F'] || 'white' }}>
                    {selectedStudent.letterGrade || '—'}
                  </div>
                  <div className="text-white/70 text-sm">{selectedStudent.finalScore !== null ? selectedStudent.finalScore + '%' : 'No grades yet'}</div>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-5">
                {CATEGORIES.filter(cat => selectedStudent.categoryAvg[cat.value] !== undefined).map(cat => (
                  <div key={cat.value} className="rounded-xl p-3.5 text-center" style={{ background: cat.color + '15' }}>
                    <p className="text-xs font-semibold capitalize mb-1" style={{ color: cat.color }}>{cat.label}</p>
                    <p className="text-2xl font-bold" style={{ color: cat.color }}>
                      {selectedStudent.categoryAvg[cat.value] !== null ? selectedStudent.categoryAvg[cat.value] + '%' : '—'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Individual scores table */}
              <div className="border-t border-gray-100">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    {['Assessment', 'Type', 'Score', 'Max', '%', 'Result'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {items.map(item => {
                      const score = selectedStudent.grades[item.id]
                      const pct = score !== null ? Math.round((score / Number(item.max_score)) * 100) : null
                      const cat = CATEGORIES.find(c => c.value === item.category)
                      return (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.title}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: (cat?.color || '#888') + '20', color: cat?.color || '#888' }}>
                              {cat?.label || item.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{score !== null ? score : '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{item.max_score}</td>
                          <td className="px-4 py-3 text-sm font-semibold" style={{ color: pct !== null ? (pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444') : '#9ca3af' }}>
                            {pct !== null ? pct + '%' : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {pct !== null && (
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${pct >= 70 ? 'bg-green-50 text-green-700' : pct >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>
                                {pct >= 70 ? 'Pass' : 'Needs Work'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
