import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Award, Download, ExternalLink, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export const metadata = { title: 'Certificates' }

export default async function CertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: certificates } = await supabase
    .from('certificates')
    .select(`*, course:courses(title, thumbnail_url, category:categories(name, icon), instructor:profiles(full_name))`)
    .eq('student_id', user.id)
    .eq('status', 'issued')
    .order('issued_at', { ascending: false })

  // Also get completed enrollments without certificates yet
  const { data: completedEnrollments } = await supabase
    .from('enrollments')
    .select(`*, course:courses(id, title, category:categories(icon))`)
    .eq('student_id', user.id)
    .eq('status', 'completed')

  const certCourseIds = new Set(certificates?.map(c => c.course_id))
  const pendingCerts = completedEnrollments?.filter(e => !certCourseIds.has(e.course_id)) || []

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
        <p className="text-gray-500 text-sm mt-1">
          {certificates?.length || 0} certificate{certificates?.length !== 1 ? 's' : ''} earned
        </p>
      </div>

      {/* Issued certificates */}
      {certificates && certificates.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-5">
          {certificates.map(cert => (
            <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Certificate preview */}
              <div className="h-40 bg-gradient-to-br from-bloomy-600 via-blue-600 to-purple-700 relative p-6 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{cert.course?.category?.icon || '🏆'}</span>
                  </div>
                  <Award className="w-8 h-8 text-yellow-300 opacity-80" />
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Certificate of Completion</p>
                  <p className="text-white font-bold text-sm mt-0.5 line-clamp-1">{cert.course?.title}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span>Issued {format(new Date(cert.issued_at), 'MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-gray-400">{cert.certificate_number}</p>
                    <p className="text-xs text-gray-500 mt-0.5">by {cert.course?.instructor?.full_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {cert.pdf_url && (
                      <a
                        href={cert.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-bloomy-50 text-bloomy-600 hover:bg-bloomy-100 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/certificate/${cert.certificate_number}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                      title="View"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Award className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">No certificates yet</p>
          <p className="text-sm text-gray-400 mb-5">Complete a course to earn your first certificate</p>
          <Link href="/courses" className="btn-primary inline-flex">Browse Courses</Link>
        </div>
      )}

      {/* Pending certificates */}
      {pendingCerts.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Processing</h2>
          <div className="space-y-3">
            {pendingCerts.map(e => (
              <div key={e.id} className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                <span className="text-2xl">{e.course?.category?.icon || '📚'}</span>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{e.course?.title}</p>
                  <p className="text-xs text-yellow-600 mt-0.5">Certificate being generated...</p>
                </div>
                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
