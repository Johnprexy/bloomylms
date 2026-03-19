import { redirect } from 'next/navigation'

import Link from 'next/link'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { Award, Download, ExternalLink, CheckCircle } from 'lucide-react'

import { format } from 'date-fns'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'Certificates' }

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const userId = (session.user as any).id
  const certs = await sql`SELECT ce.*, c.title as course_title, cat.icon as category_icon, u.full_name as instructor_name FROM certificates ce JOIN courses c ON ce.course_id = c.id LEFT JOIN categories cat ON c.category_id = cat.id LEFT JOIN users u ON c.instructor_id = u.id WHERE ce.student_id = ${userId} AND ce.status = 'issued' ORDER BY ce.issued_at DESC`
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div><h1 className="text-2xl font-bold text-gray-900">My Certificates</h1><p className="text-gray-500 text-sm mt-1">{certs.length} earned</p></div>
      {certs.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-5">
          {certs.map((cert: any) => (
            <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 bg-gradient-to-br from-bloomy-600 via-blue-600 to-purple-700 relative p-6 flex flex-col justify-between">
                <div className="flex items-start justify-between"><div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"><span className="text-2xl">{cert.category_icon || '🏆'}</span></div><Award className="w-8 h-8 text-yellow-300 opacity-80" /></div>
                <div><p className="text-white/70 text-xs font-medium uppercase tracking-wider">Certificate of Completion</p><p className="text-white font-bold text-sm mt-0.5">{cert.course_title}</p></div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3"><CheckCircle className="w-3.5 h-3.5 text-green-500" />{format(new Date(cert.issued_at), 'MMMM d, yyyy')}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-gray-400">{cert.certificate_number}</p>
                  <div className="flex items-center gap-2">
                    {cert.pdf_url && <a href={cert.pdf_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg bg-bloomy-50 text-bloomy-600 hover:bg-bloomy-100"><Download className="w-4 h-4" /></a>}
                    <Link href={`/certificate/${cert.certificate_number}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100"><ExternalLink className="w-4 h-4" /></Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Award className="w-14 h-14 text-gray-200 mx-auto mb-3" /><p className="font-medium text-gray-700 mb-1">No certificates yet</p><p className="text-sm text-gray-400 mb-5">Complete a course to earn your first certificate</p><Link href="/courses" className="btn-primary inline-flex">Browse Courses</Link>
        </div>
      )}
    </div>
  )
}
