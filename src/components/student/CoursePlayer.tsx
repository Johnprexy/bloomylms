'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronDown, ChevronRight, CheckCircle, Play, FileText, HelpCircle, Paperclip, Menu, X, BookOpen, Link2, Download, ExternalLink } from 'lucide-react'
import { markLessonComplete } from '@/lib/actions/courses'
import { cn } from '@/lib/utils'
import QuizComponent from './QuizComponent'

interface Props {
  course: any
  modules: any[]
  enrollment: any
  lessonProgress: any[]
  userId: string
  userName?: string
  initialLessonId?: string
  initialTab?: 'content' | 'discussions' | 'resources'
}

export default function CoursePlayer({ course, modules, enrollment, lessonProgress, userId, userName = '', initialLessonId, initialTab = 'content' }: Props) {
  const allLessons = modules.flatMap(m => m.lessons || [])
  const startLesson = initialLessonId ? allLessons.find(l => l.id === initialLessonId) : allLessons[0]
  const [currentLesson, setCurrentLesson] = useState<any>(startLesson || allLessons[0] || null)
  const [progress, setProgress] = useState<Record<string, boolean>>(
    Object.fromEntries((lessonProgress || []).map((lp: any) => [lp.lesson_id, lp.completed]))
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'discussions' | 'resources'>(initialTab)
  const videoRef = useRef<HTMLIFrameElement>(null)

  const completedCount = Object.values(progress).filter(Boolean).length
  const totalCount = allLessons.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const currentIndex = allLessons.findIndex((l: any) => l.id === currentLesson?.id)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Close sidebar on mobile by default
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [])

  async function handleMarkComplete() {
    if (!currentLesson || progress[currentLesson.id]) return
    setCompleting(true)
    await markLessonComplete(currentLesson.id, course.id)
    setProgress(prev => ({ ...prev, [currentLesson.id]: true }))
    setCompleting(false)
  }

  function goToLesson(lesson: any) {
    setCurrentLesson(lesson)
    setActiveTab('content')
    if (window.innerWidth < 1024) setSidebarOpen(false)
    window.scrollTo(0, 0)
  }

  const lessonIcon = (type: string) => {
    if (type === 'video') return Play
    if (type === 'quiz') return HelpCircle
    if (type === 'assignment') return Paperclip
    if (type === 'file') return FileText
    if (type === 'url') return Link2
    return FileText
  }

  // Render lesson content based on type
  const renderContent = () => {
    if (!currentLesson) return null
    const lesson = currentLesson

    if (lesson.type === 'quiz' && lesson.quiz_id) {
      return (
        <QuizComponent
          quizId={lesson.quiz_id}
          lessonId={lesson.id}
          courseId={course.id}
          userId={userId}
          onComplete={(passed) => {
            if (passed) setProgress(prev => ({ ...prev, [lesson.id]: true }))
          }}
        />
      )
    }

    if (lesson.type === 'quiz' && !lesson.quiz_id) {
      return (
        <div className="text-center py-12 text-gray-500">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Quiz not set up yet</p>
          <p className="text-sm mt-1">Your instructor hasn't added questions to this quiz yet.</p>
        </div>
      )
    }

    if (lesson.type === 'video' && lesson.video_url) {
      // Support YouTube, Vimeo, and direct video
      const isYoutube = lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be')
      const isVimeo = lesson.video_url.includes('vimeo.com')
      let embedUrl = lesson.video_url

      if (isYoutube) {
        const vid = lesson.video_url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]
        embedUrl = vid ? `https://www.youtube.com/embed/${vid}?rel=0` : lesson.video_url
      } else if (isVimeo) {
        const vid = lesson.video_url.match(/vimeo\.com\/(\d+)/)?.[1]
        embedUrl = vid ? `https://player.vimeo.com/video/${vid}` : lesson.video_url
      }

      return (
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            ref={videoRef}
            src={embedUrl}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            title={lesson.title}
          />
        </div>
      )
    }

    if (lesson.type === 'file' && lesson.file_url) {
      return (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FileText className="w-8 h-8 text-bloomy-500" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">{lesson.file_name || lesson.title}</p>
          <p className="text-sm text-gray-500 mb-6">Click below to open or download this file</p>
          <div className="flex items-center justify-center gap-3">
            <a href={lesson.file_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-bloomy-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-bloomy-700">
              <ExternalLink className="w-4 h-4" /> Open File
            </a>
            <a href={lesson.file_url} download className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
        </div>
      )
    }

    if (lesson.type === 'url' && (lesson.external_url || lesson.video_url)) {
      const url = lesson.external_url || lesson.video_url
      return (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Link2 className="w-8 h-8 text-bloomy-500" />
          </div>
          <p className="font-semibold text-gray-900 mb-1">{lesson.title}</p>
          <p className="text-sm text-gray-400 mb-2 font-mono truncate max-w-xs mx-auto">{url}</p>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-bloomy-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-bloomy-700 mt-4">
            <ExternalLink className="w-4 h-4" /> Open Link
          </a>
        </div>
      )
    }

    // Text / Page / Assignment content
    if (lesson.content) {
      return (
        <div className={cn(
          'bg-white rounded-xl border border-gray-100 p-6',
          lesson.type === 'assignment' && 'border-orange-100 bg-orange-50/30'
        )}>
          {lesson.type === 'assignment' && (
            <div className="flex items-center gap-2 text-orange-700 text-sm font-semibold mb-4 pb-4 border-b border-orange-100">
              <Paperclip className="w-4 h-4" />
              Assignment — read the brief and submit your work
            </div>
          )}
          <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: lesson.content }} />
        </div>
      )
    }

    return (
      <div className="text-center py-12 text-gray-400">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No content uploaded for this lesson yet.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900 -m-4 lg:-m-6">
      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-gray-800 text-white flex items-center gap-3 px-4 h-14 flex-shrink-0 border-b border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:block">Dashboard</span>
          </Link>
          <span className="text-gray-600 hidden sm:block">|</span>
          <h1 className="text-sm font-medium text-white flex-1 truncate hidden sm:block">{course.title}</h1>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-700 rounded-full">
              <div className="h-1.5 bg-bloomy-400 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs text-white font-medium">{progressPercent}%</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white p-1.5 rounded">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Content tabs */}
        <div className="bg-gray-800 border-b border-gray-700 flex items-center px-4 overflow-x-auto">
          {[
            { id: 'content', label: currentLesson?.type === 'quiz' ? 'Quiz' : 'Lesson' },
            { id: 'discussions', label: 'Discussions' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={cn('text-xs font-medium px-4 py-3.5 border-b-2 whitespace-nowrap transition-colors flex-shrink-0',
                activeTab === tab.id ? 'border-bloomy-400 text-white' : 'border-transparent text-gray-400 hover:text-gray-200')}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-6">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-5">
              {/* Lesson header */}
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{modules.find((m: any) => m.lessons?.some((l: any) => l.id === currentLesson.id))?.title}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{currentLesson.title}</h2>
                {currentLesson.type && (
                  <span className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">
                    {currentLesson.type}
                  </span>
                )}
              </div>

              {activeTab === 'content' && renderContent()}

              {activeTab === 'discussions' && (
                <div className="bg-gray-800 rounded-xl p-6 text-gray-400 text-sm text-center">
                  Discussions coming soon.
                </div>
              )}

              {/* Nav + complete */}
              {activeTab === 'content' && currentLesson.type !== 'quiz' && (
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-700">
                  <button onClick={() => prevLesson && goToLesson(prevLesson)} disabled={!prevLesson}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  {progress[currentLesson.id] ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Completed
                    </div>
                  ) : (
                    <button onClick={handleMarkComplete} disabled={completing}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60">
                      {completing ? 'Saving...' : <><CheckCircle className="w-4 h-4" /> Mark Complete</>}
                    </button>
                  )}
                  <button onClick={() => nextLesson && goToLesson(nextLesson)} disabled={!nextLesson}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 p-8 text-center">
              <div><BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Select a lesson to begin</p></div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="w-72 lg:w-80 bg-gray-800 border-l border-gray-700 flex flex-col flex-shrink-0 fixed right-0 top-0 bottom-0 z-30 lg:relative lg:z-auto overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex-shrink-0">
            <h2 className="text-sm font-bold text-white mb-1">Course Content</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{completedCount}/{totalCount} complete</span>
              <div className="flex-1 h-1 bg-gray-700 rounded-full">
                <div className="h-1 bg-bloomy-400 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {modules.map((module: any) => {
              const moduleDone = module.lessons?.filter((l: any) => progress[l.id]).length || 0
              return (
                <details key={module.id} className="group" open>
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gray-800 border-b border-gray-700 sticky top-0 z-10 select-none hover:bg-gray-750">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-semibold text-gray-200 truncate">{module.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{moduleDone}/{module.lessons?.length || 0}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  {module.lessons?.map((lesson: any) => {
                    const Icon = lessonIcon(lesson.type)
                    const isActive = currentLesson?.id === lesson.id
                    const isDone = progress[lesson.id]
                    return (
                      <button key={lesson.id} onClick={() => goToLesson(lesson)}
                        className={cn('w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-700/50 transition-colors',
                          isActive ? 'bg-gray-700 border-l-2 border-l-bloomy-400' : 'hover:bg-gray-700/50')}>
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                          isDone ? 'bg-green-500' : isActive ? 'bg-bloomy-600' : 'bg-gray-600')}>
                          {isDone ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : <Icon className="w-3 h-3 text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs leading-snug', isActive ? 'text-white font-medium' : isDone ? 'text-gray-400' : 'text-gray-300')}>
                            {lesson.title}
                          </p>
                          {lesson.video_duration > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">{Math.floor(lesson.video_duration / 60)}m</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </details>
              )
            })}
          </div>
        </aside>
      )}

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
