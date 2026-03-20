'use client'
import { useState, useEffect } from 'react'
import { BarChart2, Plus, Save, Download, Loader2, Trash2, Star } from 'lucide-react'

const CATEGORIES = [
  { value: 'attendance', label: 'Attendance', color: 'bg-blue-100 text-blue-700' },
  { value: 'assignment', label: 'Assignment', color: 'bg-orange-100 text-orange-700' },
  { value: 'quiz', label: 'Quiz', color: 'bg-purple-100 text-purple-700' },
  { value: 'midterm', label: 'Mid-term', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'final', label: 'Final Exam', color: 'bg-red-100 text-red-700' },
  { value: 'project', label: 'Project', color: 'bg-green-100 text-green-700' },
]

export default function GradebookPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [gradeItems, setGradeItems] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', category: 'assignment', max_score: 100, weight_percent: 0 })
  const [showNewItem, setShowNewItem] = useState(false)

  useEffect(() => {
    fetch('/api/admin/gradebook').then(r => r.json()).then(d => {
      setCourses(d.courses || [])
      setLoading(false)
    })
  }, [])

  async function loadCourse(courseId: string) {
    setSelectedCourse(courseId)
    const d = await fetch(`/api/admin/gradebook?course_id=${courseId}`).then(r => r.json())
    setGradeItems(d.items || [])
    setStudents(d.students || [])
    const g: Record<string, Record<string, string>> = {}
    d.grades?.forEach((gr: any) => {
      if (!g[gr.student_id]) g[gr.student_id] = {}
      g[gr.student_id][gr.grade_item_id] = gr.score?.toString() || ''
    })
    setGrades(g)
  }

  function setGrade(studentId: string, itemId: string, score: string) {
    setGrades(g => ({ ...g, [studentId]: { ...(g[studentId] || {}), [itemId]: score } }))
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
    alert('Grades saved!')
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
      setNewItem({ title: '', category: 'assignment', max_score: 100, weight_percent: 0 })
      setShowNewItem(false)
    }
  }

  function calcTotal(studentId: string) {
    const totalWeight = gradeItems.reduce((s, i) => s + Number(i.weight_percent), 0)
    if (totalWeight === 0) {
      const scores = gradeItems.map(i => ({ score: parseFloat(grades[studentId]?.[i.id] || '0'), max: Number(i.max_score) })).filter(s => !isNaN(s.score))
      if (!scores.length) return '—'
      const pct = scores.reduce((s, i) => s + (i.score / i.max) * 100, 0) / scores.length
      return pct.toFixed(1) + '%'
    }
    const weighted = gradeItems.reduce((s, i) => {
      const score = parseFloat(grades[studentId]?.[i.id] || '0')
      return s + (isNaN(score) ? 0 : (score / Number(i.max_score)) * Number(i.weight_percent))
    }, 0)
    return weighted.toFixed(1) + '%'
  }

  function exportCSV() {
    const header = ['Student', 'Email', ...gradeItems.map(i => i.title), 'Total']
    const rows = students.map(s => [
      s.full_name, s.email,
      ...gradeItems.map(i => grades[s.id]?.[i.id] || ''),
      calcTotal(s.id),
    ])
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'grades.csv'; a.click()
  }

  const inp = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-bloomy-500'

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-bloomy-500" /></div>

  return (
    <div className="max-w-full mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track grades, assignments, and exams</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCourse && <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-1.5"><Download className="w-4 h-4" />Export CSV</button>}
          {selectedCourse && <button onClick={() => setShowNewItem(!showNewItem)} className="btn-secondary text-sm flex items-center gap-1.5"><Plus className="w-4 h-4" />Add Item</button>}
          {selectedCourse && <button onClick={saveGrades} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save</button>}
        </div>
      </div>

      {/* Course selector */}
      <div className="flex flex-wrap gap-2">
        {courses.map(c => (
          <button key={c.id} onClick={() => loadCourse(c.id)}
            className={`text-sm px-4 py-2 rounded-xl border font-medium transition-colors ${selectedCourse === c.id ? 'bg-bloomy-600 text-white border-bloomy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
            {c.title}
          </button>
        ))}
      </div>

      {/* Add grade item form */}
      {showNewItem && (
        <div className="bg-white rounded-xl border border-bloomy-100 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">Title *</label>
              <input value={newItem.title} onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))} className={inp + ' w-full'} placeholder="e.g. Week 1 Assignment" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
              <select value={newItem.category} onChange={e => setNewItem(n => ({ ...n, category: e.target.value }))} className={inp + ' w-full'}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Max Score</label>
              <input type="number" value={newItem.max_score} onChange={e => setNewItem(n => ({ ...n, max_score: parseInt(e.target.value) }))} className={inp + ' w-full'} min={1} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Weight %</label>
              <input type="number" value={newItem.weight_percent} onChange={e => setNewItem(n => ({ ...n, weight_percent: parseFloat(e.target.value) }))} className={inp + ' w-full'} min={0} max={100} step={0.5} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addGradeItem} className="btn-primary text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Add</button>
            <button onClick={() => setShowNewItem(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Grades table */}
      {selectedCourse && students.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 sticky left-0 bg-white min-w-[180px]">Student</th>
                  {gradeItems.map(item => (
                    <th key={item.id} className="text-center text-xs font-semibold text-gray-500 px-3 py-3 min-w-[100px]">
                      <div>{item.title}</div>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORIES.find(c => c.value === item.category)?.color || 'bg-gray-100 text-gray-600'}`}>
                          {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                        </span>
                        <span className="text-gray-400">/{item.max_score}</span>
                      </div>
                      {Number(item.weight_percent) > 0 && <div className="text-gray-400 text-xs">{item.weight_percent}%</div>}
                    </th>
                  ))}
                  <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3 min-w-[80px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 sticky left-0 bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {student.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div><p className="text-sm font-medium text-gray-900">{student.full_name}</p></div>
                      </div>
                    </td>
                    {gradeItems.map(item => (
                      <td key={item.id} className="px-3 py-2.5 text-center">
                        <input
                          type="number"
                          value={grades[student.id]?.[item.id] || ''}
                          onChange={e => setGrade(student.id, item.id, e.target.value)}
                          min={0}
                          max={item.max_score}
                          className="w-16 text-center text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-bloomy-400"
                          placeholder="—"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-sm font-bold text-bloomy-700">{calcTotal(student.id)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCourse && students.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <BarChart2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No students enrolled in this course yet</p>
        </div>
      )}

      {!selectedCourse && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Select a course above to view the gradebook</p>
        </div>
      )}
    </div>
  )
}
