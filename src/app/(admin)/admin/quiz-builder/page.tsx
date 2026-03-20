'use client'
import { useState, useEffect } from 'react'
import { HelpCircle, BookOpen, Loader2, ChevronRight, CheckCircle } from 'lucide-react'
import QuizBuilder from '@/components/admin/QuizBuilder'

export default function QuizBuilderPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingModules, setLoadingModules] = useState(false)

  useEffect(() => {
    fetch('/api/admin/course-builder').then(r => r.json()).then(d => {
      setCourses(d.data || [])
      setLoading(false)
    })
  }, [])

  async function loadCourse(course: any) {
    setSelectedCourse(course)
    setSelectedLesson(null)
    setLoadingModules(true)
    const d = await fetch(`/api/instructor/courses/${course.id}/modules`).then(r => r.json())
    // Only show quiz-type lessons
    const mods = (d.data || []).map((m: any) => ({
      ...m,
      lessons: (m.lessons || []).filter((l: any) => l.type === 'quiz')
    })).filter((m: any) => m.lessons.length > 0)
    setModules(mods)
    setLoadingModules(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-bloomy-500" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
        <p className="text-sm text-gray-500 mt-0.5">Select a course, then a quiz lesson to build or edit questions</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Step 1 — Course */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-bloomy-600 text-white text-xs font-bold flex items-center justify-center">1</div>
            <span className="font-semibold text-sm text-gray-900">Select Course</span>
          </div>
          <div className="divide-y divide-gray-50">
            {courses.map((c: any) => (
              <button key={c.id} onClick={() => loadCourse(c)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${selectedCourse?.id === c.id ? 'bg-bloomy-50 border-l-2 border-bloomy-500' : ''}`}>
                <div className="w-9 h-9 bloomy-gradient rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {c.title?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.total_lessons || 0} lessons</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 — Quiz lessons */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-bloomy-600 text-white text-xs font-bold flex items-center justify-center">2</div>
            <span className="font-semibold text-sm text-gray-900">Select Quiz</span>
          </div>
          {loadingModules ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-bloomy-400" /></div>
          ) : !selectedCourse ? (
            <div className="text-center py-12 text-sm text-gray-400 px-4">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />Select a course first
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 px-4">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-gray-600">No quiz lessons found</p>
              <p className="mt-1">Go to Course Builder → add a lesson with type "Quiz" → save the course → come back here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {modules.map((m: any) => (
                <div key={m.id}>
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{m.title}</p>
                  </div>
                  {m.lessons.map((l: any) => (
                    <button key={l.id} onClick={() => setSelectedLesson(l)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors ${selectedLesson?.id === l.id ? 'bg-purple-50 border-l-2 border-purple-500' : ''}`}>
                      <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                        <p className="text-xs text-gray-400">Quiz lesson</p>
                      </div>
                      {selectedLesson?.id === l.id && <CheckCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 3 — Action */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-bloomy-600 text-white text-xs font-bold flex items-center justify-center">3</div>
            <span className="font-semibold text-sm text-gray-900">Build Questions</span>
          </div>
          {!selectedLesson ? (
            <div className="text-center py-12 text-sm text-gray-400 px-4">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />Select a quiz lesson to start
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm font-semibold text-purple-900 mb-0.5">{selectedLesson.title}</p>
                <p className="text-xs text-purple-600">{selectedCourse?.title}</p>
              </div>
              <button
                onClick={() => setSelectedLesson({ ...selectedLesson, _open: true })}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <HelpCircle className="w-4 h-4" />Open Quiz Builder
              </button>
              <p className="text-xs text-gray-400 text-center">
                5 question types: Multiple Choice, Multiple Answer,<br/>True/False, Fill in the Blank, Short Answer
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Builder Modal */}
      {selectedLesson?._open && (
        <QuizBuilder
          lessonId={selectedLesson.id}
          lessonTitle={selectedLesson.title}
          courseId={selectedCourse?.id}
          onClose={() => setSelectedLesson((l: any) => l ? { ...l, _open: false } : null)}
          onSaved={() => {/* refresh if needed */}}
        />
      )}
    </div>
  )
}
