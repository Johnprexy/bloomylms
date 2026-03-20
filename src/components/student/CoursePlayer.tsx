'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronDown, ChevronRight, CheckCircle, Play, FileText, HelpCircle, Paperclip, Menu, X, BookOpen, Link2, Download, ExternalLink, Upload, Loader2, MessageSquare, Type } from 'lucide-react'
import { markLessonComplete } from '@/lib/actions/courses'
import { cn } from '@/lib/utils'
import QuizComponent from './QuizComponent'
import FileUpload from '@/components/ui/FileUpload'

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
  const allLessons = modules.flatMap(m => (m.lessons || []).filter((l: any) => l.type !== 'text_header'))
  const startLesson = initialLessonId ? allLessons.find(l => l.id === initialLessonId) : allLessons[0]
  const [currentLesson, setCurrentLesson] = useState<any>(startLesson || allLessons[0] || null)
  const [progress, setProgress] = useState<Record<string, boolean>>(
    Object.fromEntries((lessonProgress || []).map((lp: any) => [lp.lesson_id, lp.completed]))
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'discussions'>(initialTab === 'discussions' ? 'discussions' : 'content')

  // Assignment submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitFile, setSubmitFile] = useState('')
  const [submitFileName, setSubmitFileName] = useState('')
  const [submitNotes, setSubmitNotes] = useState('')
  const [submitDone, setSubmitDone] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }, [])

  useEffect(() => {
    if (currentLesson?.type === 'assignment') loadSubmissions()
    setSubmitDone(false)
    setSubmitFile(''); setSubmitFileName(''); setSubmitNotes('')
  }, [currentLesson?.id])

  async function loadSubmissions() {
    if (!currentLesson?.id) return
    setLoadingSubmissions(true)
    const d = await fetch(`/api/assignments?lesson_id=${currentLesson.id}`).then(r => r.json())
    setSubmissions(d.data || [])
    if (d.data?.length > 0) setSubmitDone(true)
    setLoadingSubmissions(false)
  }

  async function submitAssignment() {
    if (!submitFile || !currentLesson) return
    setSubmitting(true)
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: currentLesson.id,
        course_id: course.id,
        file_url: submitFile,
        file_name: submitFileName,
        notes: submitNotes,
      }),
    }).then(r => r.json())
    setSubmitting(false)
    if (res.data) {
      setSubmitDone(true)
      setProgress(prev => ({ ...prev, [currentLesson.id]: true }))
      await loadSubmissions()
    }
  }

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
    const icons: Record<string, any> = { video: Play, quiz: HelpCircle, assignment: Paperclip, file: FileText, url: Link2, page: BookOpen, text_header: Type, survey: MessageSquare }
    return icons[type] || FileText
  }

  const completedCount = Object.values(progress).filter(Boolean).length
  const progressPercent = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0
  const currentIndex = allLessons.findIndex((l: any) => l.id === currentLesson?.id)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Completion requirement per type
  const requiresAction = (type: string) => ['quiz','assignment','survey'].includes(type)
  const canMarkDone = (lesson: any) => !requiresAction(lesson?.type)

  const renderContent = () => {
    if (!currentLesson) return null
    const lesson = currentLesson

    // QUIZ
    if (lesson.type === 'quiz') {
      if (lesson.quiz_id) {
        return (
          <QuizComponent quizId={lesson.quiz_id} lessonId={lesson.id} courseId={course.id} userId={userId}
            onComplete={(passed) => { if (passed) setProgress(prev => ({ ...prev, [lesson.id]: true })) }} />
        )
      }
      return (
        <div className="text-center py-12 text-gray-400">
          <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Quiz not set up yet</p>
          <p className="text-sm mt-1">Your instructor hasn't added questions yet.</p>
        </div>
      )
    }

    // ASSIGNMENT
    if (lesson.type === 'assignment') {
      return (
        <div className="space-y-5">
          {/* Brief */}
          {lesson.content && (
            <div className="bg-white rounded-xl border border-orange-100 p-5">
              <div className="flex items-center gap-2 text-orange-700 text-sm font-semibold mb-3 pb-3 border-b border-orange-100">
                <Paperclip className="w-4 h-4" />Assignment Brief
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{lesson.content}</div>
            </div>
          )}

          {/* Past submissions */}
          {submissions.length > 0 && (
            <div className="bg-green-900/20 rounded-xl border border-green-700/30 p-4">
              <p className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />Submitted ({submissions.length})
              </p>
              {submissions.slice(0, 3).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-green-700/20 last:border-0">
                  <FileText className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 truncate">{s.file_name || 'Submission'}</p>
                    <p className="text-xs text-gray-500">{new Date(s.submitted_at).toLocaleDateString('en-GB', { day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' })}</p>
                  </div>
                  {s.grade !== null && s.grade !== undefined && (
                    <span className="text-sm font-bold text-green-400">{s.grade}/100</span>
                  )}
                  <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="text-bloomy-400 hover:text-bloomy-300">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Upload submission */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-bloomy-400" />
              {submissions.length > 0 ? 'Resubmit' : 'Submit Your Work'}
            </p>
            <FileUpload
              value={submitFile}
              fileName={submitFileName}
              onChange={(url, name) => { setSubmitFile(url); setSubmitFileName(name) }}
              label="Upload your file (PDF, Word, ZIP, images)"
            />
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes (optional)</label>
              <textarea value={submitNotes} onChange={e => setSubmitNotes(e.target.value)}
                rows={2} className="w-full bg-gray-700 border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-bloomy-500 resize-none placeholder:text-gray-500"
                placeholder="Add any notes for your instructor..." />
            </div>
            <button onClick={submitAssignment} disabled={submitting || !submitFile}
              className="mt-4 flex items-center gap-2 bg-bloomy-600 hover:bg-bloomy-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Upload className="w-4 h-4" />Submit Assignment</>}
            </button>
          </div>
        </div>
      )
    }

    // VIDEO
    if (lesson.type === 'video' && (lesson.video_url || lesson.external_url)) {
      const url = lesson.video_url || lesson.external_url
      let embedUrl = url
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const vid = url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1]
        if (vid) embedUrl = `https://www.youtube.com/embed/${vid}?rel=0`
      } else if (url.includes('vimeo.com')) {
        const vid = url.match(/vimeo\.com\/(\d+)/)?.[1]
        if (vid) embedUrl = `https://player.vimeo.com/video/${vid}`
      }
      return (
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <iframe src={embedUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="w-full h-full" title={lesson.title} />
        </div>
      )
    }

    // FILE
    if (lesson.type === 'file' && (lesson.file_url || lesson.video_url)) {
      const url = lesson.file_url || lesson.video_url
      return (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-bloomy-400" />
          </div>
          <p className="font-semibold text-white mb-1">{lesson.file_name || lesson.title}</p>
          <p className="text-sm text-gray-400 mb-6">Download or view this course material</p>
          <div className="flex items-center justify-center gap-3">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-bloomy-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-bloomy-500">
              <ExternalLink className="w-4 h-4" />Open
            </a>
            <a href={url} download className="flex items-center gap-2 bg-gray-700 border border-gray-600 text-gray-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-600">
              <Download className="w-4 h-4" />Download
            </a>
          </div>
        </div>
      )
    }

    // URL
    if (lesson.type === 'url' && (lesson.external_url || lesson.video_url)) {
      const url = lesson.external_url || lesson.video_url
      return (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Link2 className="w-8 h-8 text-bloomy-400" />
          </div>
          <p className="font-semibold text-white mb-1">{lesson.title}</p>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-bloomy-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-bloomy-500 mt-4">
            <ExternalLink className="w-4 h-4" />Open Link
          </a>
        </div>
      )
    }

    // SURVEY
    if (lesson.type === 'survey') {
      return (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-purple-900/40 rounded-xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-purple-400" />
          </div>
          <p className="font-semibold text-white mb-1">Survey / Feedback</p>
          <p className="text-sm text-gray-400 mb-6">Your instructor wants your feedback — it only takes a minute</p>
          {lesson.content ? (
            <a href={lesson.content} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-500">
              <ExternalLink className="w-4 h-4" />Open Survey
            </a>
          ) : (
            <p className="text-sm text-gray-500">Survey link coming soon from your instructor</p>
          )}
          <button onClick={handleMarkComplete} disabled={progress[lesson.id] || completing}
            className="mt-4 flex items-center justify-center gap-2 mx-auto text-sm text-green-400 hover:text-green-300 disabled:opacity-50">
            <CheckCircle className="w-4 h-4" />
            {progress[lesson.id] ? 'Marked complete' : 'Mark survey as done'}
          </button>
        </div>
      )
    }

    // PAGE / TEXT
    if (lesson.content) {
      return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">{lesson.content}</div>
        </div>
      )
    }

    return (
      <div className="text-center py-12 text-gray-400">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No content uploaded yet.</p>
      </div>
    )
  }

  // Completion requirements per type
  const completionNote = (type: string) => {
    if (type === 'quiz') return 'Complete the quiz to mark this done'
    if (type === 'assignment') return 'Submit your work to mark this done'
    if (type === 'survey') return 'Complete the survey then mark done'
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-900 -m-4 lg:-m-6">
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
              <div className="h-1.5 bg-bloomy-400 rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-xs text-white font-medium">{progressPercent}%</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white p-1.5 rounded">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 lg:pb-6">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{modules.find((m: any) => m.lessons?.some((l: any) => l.id === currentLesson.id))?.title}</span>
                </div>
                <h2 className="text-xl font-bold text-white">{currentLesson.title}</h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">
                    {currentLesson.type?.replace('_', ' ')}
                  </span>
                  {completionNote(currentLesson.type) && (
                    <span className="text-xs text-orange-400">{completionNote(currentLesson.type)}</span>
                  )}
                </div>
              </div>

              {renderContent()}

              {/* Nav + complete */}
              {!['quiz'].includes(currentLesson.type) && (
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-700">
                  <button onClick={() => prevLesson && goToLesson(prevLesson)} disabled={!prevLesson}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />Previous
                  </button>
                  {progress[currentLesson.id] ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />Completed
                    </div>
                  ) : canMarkDone(currentLesson) ? (
                    <button onClick={handleMarkComplete} disabled={completing}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-60">
                      {completing ? 'Saving...' : <><CheckCircle className="w-4 h-4" />Mark Complete</>}
                    </button>
                  ) : null}
                  <button onClick={() => nextLesson && goToLesson(nextLesson)} disabled={!nextLesson}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:opacity-30">
                    Next<ChevronRight className="w-4 h-4" />
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
              <span>{completedCount}/{allLessons.length} complete</span>
              <div className="flex-1 h-1 bg-gray-700 rounded-full">
                <div className="h-1 bg-bloomy-400 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {modules.map((module: any) => {
              const moduleLessons = (module.lessons || [])
              const nonHeader = moduleLessons.filter((l: any) => l.type !== 'text_header')
              const moduleDone = nonHeader.filter((l: any) => progress[l.id]).length
              return (
                <details key={module.id} className="group" open>
                  <summary className="flex items-center justify-between px-4 py-3 cursor-pointer bg-gray-800 border-b border-gray-700 sticky top-0 z-10 select-none hover:bg-gray-750">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs font-semibold text-gray-200 truncate">{module.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{moduleDone}/{nonHeader.length}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0" />
                  </summary>
                  {moduleLessons.map((lesson: any) => {
                    if (lesson.type === 'text_header') {
                      return (
                        <div key={lesson.id} className="px-4 py-2 border-b border-gray-700/50 bg-gray-900/30">
                          <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider">{lesson.title}</p>
                        </div>
                      )
                    }
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

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
