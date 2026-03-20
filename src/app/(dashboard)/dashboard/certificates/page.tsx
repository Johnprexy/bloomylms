import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Award, Download, ExternalLink, CheckCircle, ArrowLeft, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import GenerateCertButton from '@/components/student/GenerateCertButton'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Certificates' }

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id

  const certs = await sql`
    SELECT ce.id, ce.certificate_number, ce.issued_at, ce.pdf_url,
      c.title as course_title, cat.icon as category_icon
    FROM certificates ce
    JOIN courses c ON ce.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE ce.student_id = ${userId} AND ce.status = 'issued'
    ORDER BY ce.issued_at DESC
  `

  const completedNoCert = await sql`
    SELECT e.id as enrollment_id, c.title, c.certificate_enabled,
      cat.icon as category_icon
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    LEFT JOIN categories cat ON c.category_id = cat.id
    WHERE e.student_id = ${userId}
      AND e.status = 'completed'
      AND c.certificate_enabled = true
      AND NOT EXISTS (
        SELECT 1 FROM certificates ce
        WHERE ce.enrollment_id = e.id AND ce.status = 'issued'
      )
  `

  return (
    <div className="max-w-4xl mx-auto space-y-7">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 p-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">My Certificates</h1>
          <p className="text-gray-500 text-sm mt-0.5">{certs.length} earned</p>
        </div>
      </div>

      {completedNoCert.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" /> Ready to Claim
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {completedNoCert.map((c: any) => (
              <div key={c.enrollment_id} className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {c.category_icon || '🏆'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">Course completed</p>
                </div>
                <GenerateCertButton enrollmentId={c.enrollment_id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {certs.length > 0 ? (
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" /> Earned ({certs.length})
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {certs.map((cert: any) => (
              <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="h-28 bg-gradient-to-br from-bloomy-600 via-blue-600 to-purple-700 p-4 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-xl">{cert.category_icon || '🏆'}</span>
                    </div>
                    <Award className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Certificate of Completion</p>
                    <p className="text-white font-bold text-sm mt-0.5 line-clamp-1">{cert.course_title}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    {format(new Date(cert.issued_at), 'MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-mono text-gray-400 truncate flex-1 mr-2">{cert.certificate_number}</p>
                    <div className="flex gap-2">
                      {cert.pdf_url && (
                        <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-bloomy-50 text-bloomy-600 hover:bg-bloomy-100">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Link href={`/certificate/${cert.certificate_number}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : completedNoCert.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Award className="w-14 h-14 text-gray-200 mx-auto mb-3" />
          <p className="font-medium text-gray-700 mb-1">No certificates yet</p>
          <p className="text-sm text-gray-400 mb-6">Complete a course to earn your certificate</p>
          <Link href="/dashboard/my-courses" className="btn-primary inline-flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4" /> View My Courses
          </Link>
        </div>
      )}
    </div>
  )
}
