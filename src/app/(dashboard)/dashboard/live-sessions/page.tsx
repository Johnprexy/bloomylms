import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Video, Calendar, Clock, ExternalLink, BookOpen } from 'lucide-react'
import { format, isAfter, isBefore, addHours } from 'date-fns'

export const metadata = { title: 'Live Sessions' }

export default async function LiveSessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get enrolled course IDs
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', user.id)
    .eq('status', 'active')

  const enrolledCourseIds = enrollments?.map(e => e.course_id) || []

  const { data: sessions } = await supabase
    .from('live_sessions')
    .select(`*, course:courses(id, title, category:categories(icon)), instructor:profiles(full_name)`)
    .in('course_id', enrolledCourseIds)
    .order('starts_at', { ascending: true })

  const now = new Date()
  const upcoming = sessions?.filter(s => isAfter(new Date(s.starts_at), now)) || []
  const live = sessions?.filter(s => {
    const start = new Date(s.starts_at)
    const end = s.ends_at ? new Date(s.ends_at) : addHours(start, 2)
    return isBefore(start, now) && isAfter(end, now)
  }) || []
  const past = sessions?.filter(s => {
    const end = s.ends_at ? new Date(s.ends_at) : addHours(new Date(s.starts_at), 2)
    return isBefore(end, now)
  }) || []

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Sessions</h1>
        <p className="text-sm text-gray-500 mt-1">Join live classes from your enrolled courses</p>
      </div>

      {/* Live now */}
      {live.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <h2 className="text-base font-bold text-gray-900">Live Now</h2>
          </div>
          <div className="space-y-3">
            {live.map(s => (
              <SessionCard key={s.id} session={s} status="live" />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Upcoming Sessions</h2>
          <div className="space-y-3">
            {upcoming.map(s => (
              <SessionCard key={s.id} session={s} status="upcoming" />
            ))}
          </div>
        </div>
      )}

      {/* Past / recordings */}
      {past.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-3">Past Sessions</h2>
          <div className="space-y-3">
            {past.slice(0, 6).map(s => (
              <SessionCard key={s.id} session={s} status="past" />
            ))}
          </div>
        </div>
      )}

      {sessions?.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Video className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">No live sessions scheduled</p>
          <p className="text-sm text-gray-400 mb-5">Enroll in a course to see live sessions</p>
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, status }: { session: any; status: 'live' | 'upcoming' | 'past' }) {
  const start = new Date(session.starts_at)

  return (
    <div className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${
      status === 'live' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${
        status === 'live' ? 'bg-red-100' : 'bg-bloomy-50'
      }`}>
        {session.course?.category?.icon || '📚'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-sm text-gray-900 truncate">{session.title}</h3>
          {status === 'live' && (
            <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex-shrink-0">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-1 truncate">{session.course?.title}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(start, 'MMM d, yyyy')}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(start, 'h:mm a')}</span>
          <span>by {session.instructor?.full_name}</span>
        </div>
      </div>

      <div className="flex-shrink-0">
        {status === 'live' && session.meeting_url && (
          <a
            href={session.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Video className="w-4 h-4" /> Join Now
          </a>
        )}
        {status === 'upcoming' && (
          <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            {format(start, 'h:mm a')}
          </span>
        )}
        {status === 'past' && session.recording_url && (
          <a
            href={session.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-bloomy-600 hover:text-bloomy-700 text-sm font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Watch Recording
          </a>
        )}
      </div>
    </div>
  )
}
