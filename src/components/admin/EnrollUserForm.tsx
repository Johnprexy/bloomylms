'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CheckCircle, Loader2, Plus } from 'lucide-react'

export default function EnrollUserForm({ userId, courses, enrolledIds }: { userId: string; courses: any[]; enrolledIds: string[] }) {
  const router = useRouter()
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set(enrolledIds))
  const [msg, setMsg] = useState('')

  async function enroll(courseId: string) {
    setEnrolling(courseId)
    const res = await fetch('/api/admin/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, course_id: courseId }),
    }).then(r => r.json())
    setEnrolling(null)
    if (res.error) { setMsg(res.error); return }
    setEnrolled(prev => new Set([...prev, courseId]))
    setMsg('✓ Enrolled successfully')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="space-y-4">
      {msg && <div className={`text-sm font-medium px-4 py-3 rounded-lg ${msg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg}</div>}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {courses.map(course => {
          const isEnrolled = enrolled.has(course.id)
          return (
            <div key={course.id} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0">
              <div className="w-10 h-10 bg-bloomy-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {course.icon || '📚'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {course.status}
                </span>
              </div>
              {isEnrolled ? (
                <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium flex-shrink-0">
                  <CheckCircle className="w-4 h-4" /> Enrolled
                </div>
              ) : (
                <button onClick={() => enroll(course.id)} disabled={enrolling === course.id}
                  className="btn-primary text-sm flex items-center gap-1.5 flex-shrink-0 py-1.5">
                  {enrolling === course.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Enroll
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
