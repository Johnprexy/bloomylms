'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, Save, Download, Loader2, Trash2, Search, Filter, ChevronDown, X, Check, AlertCircle } from 'lucide-react'

const CATEGORIES = [
  { value: 'attendance', label: 'Roll Call', short: 'ATT', color: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
  { value: 'assignment', label: 'Assignment', short: 'ASMT', color: '#f97316', bg: '#fff7ed', text: '#c2410c' },
  { value: 'quiz', label: 'Quiz', short: 'QUIZ', color: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9' },
  { value: 'midterm', label: 'Mid-term', short: 'MID', color: '#eab308', bg: '#fefce8', text: '#a16207' },
  { value: 'final', label: 'Final Exam', short: 'FINAL', color: '#ef4444', bg: '#fef2f2', text: '#b91c1c' },
  { value: 'project', label: 'Project', short: 'PROJ', color: '#10b981', bg: '#f0fdf4', text: '#047857' },
]

function getLetterGrade(pct: number) {
  if (pct >= 90) return { letter: 'A', color: '#10b981' }
  if (pct >= 80) return { letter: 'B', color: '#3b82f6' }
  if (pct >= 70) return { letter: 'C', color: '#f59e0b' }
  if (pct >= 60) return { letter: 'D', color: '#f97316' }
  return { letter: 'F', color: '#ef4444' }
}

export default function GradebookPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedCourseName, setSelectedCourseName] = useState('')
  const [gradeItems, setGradeItems] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingCell, setEditingCell] = useState<{ studentId: string; itemId: string } | null>(null)
  const [newItem, setNewItem] = useState({ title: '', category: 'assignment', max_score: 100, weight_percent: 20 })
  const cellRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/gradebook').then(r => r.json()).then(d => {
      setCourses(d.courses || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (editingCell && cellRef.current) cellRef.current.focus()
  }, [editingCell])

  async function loadCourse(courseId: string, courseName: string) {
    setSelectedCourse(courseId)
    setSelectedCourseName(courseName)
    setLoading(true)
    const d = await fetch(`/api/admin/gradebook?course_id=${courseId}`).then(r => r.json())
    setGradeItems(d.items || [])
    setStudents(d.students || [])
    const g: Record<string, Record<string, string>> = {}
    d.grades?.forEach((gr: any) => {
      if (!g[gr.student_id]) g[gr.student_id] = {}
      g[gr.student_id][gr.grade_item_id] = gr.score !== null && gr.score !== undefined ? String(gr.score) : ''
    })
    setGrades(g)
    setLoading(false)
  }

  async function saveGrades() {
    setSaving(true)
    const payload: any[] = []
    students.forEach(s => {
      gradeItems.forEach(item => {
        const score = grades[s.id]?.[item.id]
        if (score !== undefined && score !== '') {
          payload.push({ student_id: s.id, grade_item_id: item.id, score: parseFloat(score) })
        }
      })
    })
    await fetch('/api/admin/gradebook', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grades: payload }),
    })
    setSaving(false)
    setSavedAt(new Date())
  }

  async function addGradeItem() {
    if (!selectedCourse || !newItem.title) return
    const res = await fetch('/api/admin/gradebook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: selectedCourse, ...newItem }),
    }).then(r => r.json())
    if (res.data) {
      setGradeItems(prev => [...prev, res.data])
      setNewItem({ title: '', category: 'assignment', max_score: 100, weight_percent: 20 })
      setShowAddItem(false)
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Delete this grade item? All scores will be lost.')) return
    await fetch(`/api/admin/gradebook?item_id=${itemId}`, { method: 'DELETE' })
    setGradeItems(prev => prev.filter(i => i.id !== itemId))
  }

  function setGrade(studentId: string, itemId: string, score: string) {
    setGrades(g => ({ ...g, [studentId]: { ...(g[studentId] || {}), [itemId]: score } }))
  }

  function calcStudentTotal(studentId: string) {
    const totalWeight = gradeItems.reduce((s, i) => s + Number(i.weight_percent), 0)
    if (totalWeight === 0) {
      const valid = gradeItems.filter(i => grades[studentId]?.[i.id] !== '' && grades[studentId]?.[i.id] !== undefined)
      if (!valid.length) return null
      const avg = valid.reduce((s, i) => s + (parseFloat(grades[studentId]?.[i.id] || '0') / Number(i.max_score)) * 100, 0) / valid.length
      return avg
    }
    const weighted = gradeItems.reduce((s, i) => {
      const score = grades[studentId]?.[i.id]
      if (!score) return s
      return s + (parseFloat(score) / Number(i.max_score)) * Number(i.weight_percent)
    }, 0)
    return weighted
  }

  function exportCSV() {
    const header = ['Student Name', 'Email', ...gradeItems.map(i => `${i.title} (${i.max_score})`), 'Total %', 'Grade']
    const rows = filteredStudents.map(s => {
      const total = calcStudentTotal(s.id)
      const grade = total !== null ? getLetterGrade(total) : null
      return [
        s.full_name, s.email,
        ...gradeItems.map(i => grades[s.id]?.[i.id] || ''),
        total !== null ? total.toFixed(1) + '%' : '—',
        grade ? grade.letter : '—',
      ]
    })
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `gradebook-${selectedCourseName.replace(/\s+/g, '-')}.csv`
    a.click()
  }

  function handleCellKey(e: React.KeyboardEvent, studentId: string, itemId: string) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      setEditingCell(null)
      // Move to next student
      const si = filteredStudents.findIndex(s => s.id === studentId)
      const nextStudent = filteredStudents[si + 1]
      if (nextStudent) setEditingCell({ studentId: nextStudent.id, itemId })
    }
    if (e.key === 'Escape') setEditingCell(null)
  }

  const filteredStudents = students.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredItems = filterCat ? gradeItems.filter(i => i.category === filterCat) : gradeItems
  const totalWeight = gradeItems.reduce((s, i) => s + Number(i.weight_percent), 0)

  if (loading && !selectedCourse) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-bloomy-500" />
    </div>
  )

  return (
    <div className="h-full flex flex-col" style={{ margin: '-1rem', padding: '1rem' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">Gradebook</h1>
          {/* Course selector */}
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={e => {
                const opt = e.target.options[e.target.selectedIndex]
                loadCourse(e.target.value, opt.text)
              }}
              className="text-sm border border-gray-200 rounded-xl px-4 py-2.5 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-bloomy-500 font-medium appearance-none cursor-pointer min-w-48">
              <option value="">Select course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {selectedCourse && (
          <div className="flex items-center gap-2 flex-wrap">
            {savedAt && <span className="text-xs text-green-600 flex items-center gap-1"><Check className="w-3.5 h-3.5" />Saved {savedAt.toLocaleTimeString()}</span>}
            <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-1.5 py-2">
              <Download className="w-3.5 h-3.5" />Export CSV
            </button>
            <button onClick={() => setShowAddItem(!showAddItem)} className="btn-secondary text-sm flex items-center gap-1.5 py-2">
              <Plus className="w-3.5 h-3.5" />Add Column
            </button>
            <button onClick={saveGrades} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5 py-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}Save Grades
            </button>
          </div>
        )}
      </div>

      {/* Add column form */}
      {showAddItem && (
        <div className="bg-white rounded-2xl border border-bloomy-100 p-4 mb-4 flex items-end gap-3 flex-wrap shadow-sm">
          <div className="flex-1 min-w-40">
            <label className="text-xs font-medium text-gray-600 block mb-1">Column Title *</label>
            <input value={newItem.title} onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500"
              placeholder="e.g. Hands-On Lab: Create a VM" onKeyDown={e => e.key === 'Enter' && addGradeItem()} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
            <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none bg-white">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Max Score</label>
            <input type="number" value={newItem.max_score} onChange={e => setNewItem(n => ({ ...n, max_score: parseInt(e.target.value) }))}
              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-center" min={1} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Weight %</label>
            <input type="number" value={newItem.weight_percent} onChange={e => setNewItem(n => ({ ...n, weight_percent: parseFloat(e.target.value) }))}
              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none text-center" min={0} max={100} step={5} />
          </div>
          <div className="flex gap-2">
            <button onClick={addGradeItem} disabled={!newItem.title} className="btn-primary text-sm py-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />Add
            </button>
            <button onClick={() => setShowAddItem(false)} className="btn-secondary text-sm py-2">Cancel</button>
          </div>
          {totalWeight > 0 && (
            <div className={`text-xs px-3 py-2 rounded-lg font-medium ${totalWeight === 100 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
              Weights: {totalWeight}% {totalWeight !== 100 && '(should total 100%)'}
            </div>
          )}
        </div>
      )}

      {!selectedCourse ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-100">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-bloomy-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-bloomy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <p className="font-semibold text-gray-700 mb-1">Select a course to open the gradebook</p>
            <p className="text-sm text-gray-400">Grades, attendance, quizzes and assignments all in one view</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Filters bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-wrap">
            <div className="relative flex-1 min-w-48 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-bloomy-500" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-gray-400 flex items-center gap-1"><Filter className="w-3 h-3" />Filter:</span>
              <button onClick={() => setFilterCat('')}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${!filterCat ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All
              </button>
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setFilterCat(filterCat === cat.value ? '' : cat.value)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors`}
                  style={filterCat === cat.value ? { background: cat.color, color: 'white' } : { background: cat.bg, color: cat.text }}>
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="ml-auto text-xs text-gray-400">
              {filteredStudents.length} students · {filteredItems.length} columns
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-bloomy-500" /></div>
          ) : (
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse" style={{ minWidth: Math.max(800, 240 + filteredItems.length * 110) }}>
                <thead className="sticky top-0 z-20">
                  <tr>
                    {/* Student name header */}
                    <th className="sticky left-0 z-30 bg-white border-b border-r border-gray-200 px-4 py-3 text-left" style={{ minWidth: 200 }}>
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Student Name</span>
                    </th>
                    {/* Grade item headers */}
                    {filteredItems.map(item => {
                      const cat = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[1]
                      return (
                        <th key={item.id} className="border-b border-r border-gray-100 px-2 py-2 text-center group" style={{ minWidth: 108, background: cat.bg }}>
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate" style={{ color: cat.text }} title={item.title}>
                                {item.title}
                              </div>
                              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                                <span className="text-xs font-medium px-1.5 py-0.5 rounded text-white" style={{ background: cat.color, fontSize: 10 }}>
                                  {cat.short}
                                </span>
                                <span className="text-xs text-gray-500">/{item.max_score}</span>
                                {Number(item.weight_percent) > 0 && (
                                  <span className="text-xs text-gray-400">{item.weight_percent}%</span>
                                )}
                              </div>
                            </div>
                            <button onClick={() => deleteItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 flex-shrink-0 p-0.5 transition-opacity">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      )
                    })}
                    {/* Total column */}
                    <th className="border-b border-gray-100 px-3 py-2 text-center sticky right-0 z-20 bg-gray-50" style={{ minWidth: 80 }}>
                      <div className="text-xs font-semibold text-gray-700">Total</div>
                      <div className="text-xs text-gray-400">Grade</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={filteredItems.length + 2} className="text-center py-12 text-gray-400 text-sm">
                      {search ? 'No students match your search' : 'No students enrolled in this course'}
                    </td></tr>
                  ) : filteredStudents.map((student, si) => {
                    const total = calcStudentTotal(student.id)
                    const gradeInfo = total !== null ? getLetterGrade(total) : null
                    return (
                      <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${si % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        {/* Student name — sticky */}
                        <td className="sticky left-0 z-10 bg-white border-r border-gray-100 px-4 py-2.5" style={{ background: si % 2 === 0 ? 'white' : '#fafafa' }}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{student.full_name}</p>
                              <p className="text-xs text-gray-400 truncate">{student.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Grade cells */}
                        {filteredItems.map(item => {
                          const score = grades[student.id]?.[item.id] ?? ''
                          const isEditing = editingCell?.studentId === student.id && editingCell?.itemId === item.id
                          const numScore = parseFloat(score)
                          const pct = score !== '' && !isNaN(numScore) ? (numScore / Number(item.max_score)) * 100 : null
                          const cellColor = pct !== null ? (pct >= 70 ? '#dcfce7' : pct >= 50 ? '#fef9c3' : '#fee2e2') : 'transparent'

                          return (
                            <td key={item.id} className="border-r border-gray-100 border-b border-b-transparent p-0 text-center relative"
                              onClick={() => setEditingCell({ studentId: student.id, itemId: item.id })}>
                              {isEditing ? (
                                <input
                                  ref={cellRef}
                                  type="number"
                                  value={score}
                                  onChange={e => setGrade(student.id, item.id, e.target.value)}
                                  onKeyDown={e => handleCellKey(e, student.id, item.id)}
                                  onBlur={() => setEditingCell(null)}
                                  className="w-full h-full px-2 py-3 text-sm text-center font-semibold focus:outline-none border-2 border-bloomy-400 bg-bloomy-50 rounded"
                                  min={0} max={item.max_score}
                                  style={{ minHeight: 44 }}
                                />
                              ) : (
                                <div className="px-2 py-3 cursor-pointer hover:bg-bloomy-50 transition-colors min-h-11 flex items-center justify-center"
                                  style={{ background: cellColor }}>
                                  {score !== '' ? (
                                    <span className="text-sm font-semibold text-gray-800">{score}</span>
                                  ) : (
                                    <span className="text-gray-300 text-xs">—</span>
                                  )}
                                </div>
                              )}
                            </td>
                          )
                        })}

                        {/* Total — sticky right */}
                        <td className="sticky right-0 z-10 border-l border-gray-200 px-3 py-2.5 text-center" style={{ background: si % 2 === 0 ? 'white' : '#f9fafb' }}>
                          {total !== null ? (
                            <div>
                              <div className="text-sm font-bold" style={{ color: gradeInfo?.color }}>
                                {gradeInfo?.letter}
                              </div>
                              <div className="text-xs text-gray-500">{total.toFixed(0)}%</div>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Footer summary */}
                {filteredStudents.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td className="sticky left-0 z-10 bg-gray-50 px-4 py-2.5 border-r border-gray-200">
                        <span className="text-xs font-semibold text-gray-600">Class Average</span>
                      </td>
                      {filteredItems.map(item => {
                        const scores = filteredStudents
                          .map(s => grades[s.id]?.[item.id])
                          .filter(v => v !== undefined && v !== '')
                          .map(v => parseFloat(v!))
                          .filter(n => !isNaN(n))
                        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null
                        const avgPct = avg !== null ? (avg / Number(item.max_score)) * 100 : null
                        return (
                          <td key={item.id} className="border-r border-gray-100 px-2 py-2.5 text-center">
                            {avg !== null ? (
                              <div>
                                <div className="text-xs font-semibold text-gray-700">{avg.toFixed(1)}</div>
                                <div className="text-xs text-gray-400">{avgPct?.toFixed(0)}%</div>
                              </div>
                            ) : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                        )
                      })}
                      <td className="sticky right-0 z-10 bg-gray-50 border-l border-gray-200 px-3 py-2.5 text-center">
                        {(() => {
                          const totals = filteredStudents.map(s => calcStudentTotal(s.id)).filter(t => t !== null) as number[]
                          const avg = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : null
                          if (!avg) return <span className="text-gray-300 text-xs">—</span>
                          const g = getLetterGrade(avg)
                          return (
                            <div>
                              <div className="text-sm font-bold" style={{ color: g.color }}>{g.letter}</div>
                              <div className="text-xs text-gray-500">{avg.toFixed(0)}%</div>
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
