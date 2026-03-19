'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronDown, CheckCircle, Play, FileText, HelpCircle, Paperclip, Download, Menu, X, BookOpen, MessageSquare, Info } from 'lucide-react'
import { markLessonComplete } from '@/lib/actions/courses'
import { cn, formatDuration } from '@/lib/utils'
import type { Course, Module, Lesson, LessonProgress, Enrollment } from '@/types'
import dynamic from 'next/dynamic'

const Discussions = dynamic(() => import('@/components/student/Discussions'), { ssr: false })
const QuizComponent = dynamic(() => import('@/components/student/QuizComponent'), { ssr: false })

interface Props {
  course: any
  modules: any[]
  enrollment: Enrollment
  lessonProgress: LessonProgress[]
  userId: string
  userName?: string
}

export default function CoursePlayer({ course, modules, enrollment, lessonProgress, userId, userName = 'Student' }: Props) {
  const allLessons = modules.flatMap(m => m.lessons || [])
  const [currentLesson, setCurrentLesson] = useState<any>(allLessons[0] || null)
  const [progress, setProgress] = useState<Record<string, boolean>>(
    Object.fromEntries(lessonProgress.map(lp => [lp.lesson_id, lp.completed]))
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'discussions' | 'resources'>('content')

  const completedCount = Object.values(progress).filter(Boolean).length
  const totalCount = allLessons.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  async function handleMarkComplete() {
    if (!currentLesson || progress[currentLesson.id]) return
    setCompleting(true)
    await markLessonComplete(currentLesson.id, course.id)
    setProgress(prev => ({ ...prev, [currentLesson.id]: true }))
    setCompleting(false)
    if (nextLesson) setCurrentLesson(nextLesson)
  }

  const lessonIcon = (type: string) => {
    if (type === 'video') return Play
    if (type === 'quiz') return HelpCircle
    if (type === 'assignment') return Paperclip
    return FileText
  }

  const resourceCount = currentLesson?.resources?.length || 0

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden -m-6">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-gray-800 text-white flex items-center gap-3 px-4 h-14 flex-shrink-0 border-b border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:block">Dashboard</span>
          </Link>
          <span className="text-gray-600">|</span>
          <h1 className="text-sm font-medium text-white flex-1 truncate">{course.title}</h1>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <div className="w-24 h-1.5 bg-gray-700 rounded-full">
              <div className="h-1.5 bg-bloomy-400 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="font-medium text-white">{progressPercent}%</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white transition-colors p-1.5 rounded">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Content tabs */}
        <div className="bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-1">
          {[
            { id: 'content', label: 'Lesson', icon: Info },
            { id: 'discussions', label: 'Discussions', icon: MessageSquare },
            ...(resourceCount > 0 ? [{ id: 'resources', label: `Resources (${resourceCount})`, icon: Paperclip }] : []),
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-3 py-3 border-b-2 transition-colors',
                activeTab === tab.id ? 'border-bloomy-400 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 overflow-y-auto">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
              {/* Lesson title */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{modules.find(m => m.lessons?.some((l: any) => l.id === currentLesson.id))?.title}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{currentLesson.title}</h2>
              </div>

              {activeTab === 'content' && (
                <>
                  {/* Video */}
                  {currentLesson.type === 'video' && currentLesson.video_url && (
                    <div className="rounded-xl overflow-hidden mb-6 bg-black aspect-video">
                      <iframe
                        src={currentLesson.video_url}
                        allow="autoplay; fullscreen; picture-in-picture"
                        className="w-full h-full"
                        title={currentLesson.title}
                      />
                    </div>
                  )}

                  {/* Text/article content */}
                  {currentLesson.content && currentLesson.type !== 'quiz' && (
                    <div className="bg-gray-800 rounded-xl p-6 mb-6 text-gray-200 prose prose-invert prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                    </div>
                  )}

                  {/* Quiz */}
                  {currentLesson.type === 'quiz' && currentLesson.quiz_id && (
                    <QuizComponent
                      quizId={currentLesson.quiz_id}
                      lessonId={currentLesson.id}
                      courseId={course.id}
                      userId={userId}
                      onComplete={() => setProgress(prev => ({ ...prev, [currentLesson.id]: true }))}
                    />
                  )}
                </>
              )}

              {activeTab === 'discussions' && (
                <Discussions
                  courseId={course.id}
                  lessonId={currentLesson.id}
                  userId={userId}
                  userName={userName}
                />
              )}

              {activeTab === 'resources' && currentLesson.resources?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white mb-4">Lesson Resources</h3>
                  {currentLesson.resources.map((r: any) => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-xl p-4 transition-colors group border border-gray-700"
                    >
                      <div className="w-10 h-10 bg-bloomy-600/20 rounded-lg flex items-center justify-center text-bloomy-400 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{r.name}</p>
                        <p className="text-xs text-gray-400 uppercase mt-0.5">{r.type}</p>
                      </div>
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    </a>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-700">
                <button
                  onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                  disabled={!prevLesson}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {progress[currentLesson.id] ? (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Completed
                  </div>
                ) : (
                  <button
                    onClick={handleMarkComplete}
                    disabled={completing}
                    className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {completing ? 'Marking...' : <><CheckCircle className="w-4 h-4" /> Mark Complete</>}
                  </button>
                )}
                <button
                  onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                  disabled={!nextLesson}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronLeft className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a lesson to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* Curriculum Sidebar */}
      {sidebarOpen && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-sm font-bold text-white mb-2">Course Content</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{completedCount}/{totalCount} completed</span>
              <div className="flex-1 h-1 bg-gray-700 rounded-full">
                <div className="h-1 bg-bloomy-400 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {modules.map(module => (
              <details key={module.id} className="group" open>
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-750 select-none bg-gray-800 sticky top-0 border-b border-gray-700">
                  <div>
                    <p className="text-xs font-semibold text-gray-300">{module.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {module.lessons?.filter((l: any) => progress[l.id]).length}/{module.lessons?.length} done
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-open:rotate-180 transition-transform" />
                </summary>
                {module.lessons?.map((lesson: any) => {
                  const Icon = lessonIcon(lesson.type)
                  const isActive = currentLesson?.id === lesson.id
                  const isDone = progress[lesson.id]
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => { setCurrentLesson(lesson); setActiveTab('content') }}
                      className={cn(
                        'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors border-b border-gray-700/50',
                        isActive ? 'bg-bloomy-900/50 border-l-2 border-l-bloomy-400' : 'hover:bg-gray-700/50'
                      )}
                    >
                      <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', isDone ? 'bg-green-500' : isActive ? 'bg-bloomy-600' : 'bg-gray-700')}>
                        {isDone ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <Icon className="w-3 h-3 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-xs leading-snug', isActive ? 'text-white font-medium' : isDone ? 'text-gray-400' : 'text-gray-300')}>
                          {lesson.title}
                        </p>
                        {lesson.video_duration && (
                          <p className="text-xs text-gray-500 mt-0.5">{Math.floor(lesson.video_duration / 60)}m</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
