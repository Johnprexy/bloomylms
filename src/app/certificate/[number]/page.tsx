import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sql } from '@/lib/db'
import { Award, CheckCircle, Calendar, User, BookOpen, Shield } from 'lucide-react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function CertificateVerifyPage({ params }: { params: { number: string } }) {
  const certs = await sql`SELECT ce.*, c.title as course_title, c.duration_weeks, u.full_name as student_name, inst.full_name as instructor_name FROM certificates ce JOIN courses c ON ce.course_id = c.id JOIN users u ON ce.student_id = u.id LEFT JOIN users inst ON c.instructor_id = inst.id WHERE ce.certificate_number = ${params.number} AND ce.status = 'issued' LIMIT 1`
  const cert = certs[0]
  if (!cert) notFound()
  return (
    <div className="min-h-screen bg-gradient-to-br from-bloomy-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-bloomy-100">
          <div className="bloomy-gradient p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5" />
            <div className="relative"><div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><Award className="w-8 h-8 text-yellow-300" /></div><p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-1">Certificate of Completion</p><h1 className="text-white text-3xl font-bold">BloomyLMS</h1></div>
          </div>
          <div className="p-8">
            <div className="text-center mb-8"><p className="text-gray-500 text-sm mb-2">This is to certify that</p><h2 className="text-3xl font-bold text-gray-900 mb-2">{cert.student_name}</h2><p className="text-gray-500">has successfully completed</p><h3 className="text-xl font-bold text-bloomy-700 mt-2">{cert.course_title}</h3></div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[{ icon: Calendar, label: 'Issued', value: format(new Date(cert.issued_at), 'MMMM d, yyyy') }, { icon: BookOpen, label: 'Duration', value: `${cert.duration_weeks} Weeks` }, { icon: User, label: 'Instructor', value: cert.instructor_name }].map(item => (
                <div key={item.label} className="text-center bg-gray-50 rounded-xl p-4"><item.icon className="w-5 h-5 text-bloomy-400 mx-auto mb-1.5" /><p className="text-xs text-gray-400 mb-0.5">{item.label}</p><p className="text-sm font-semibold text-gray-900">{item.value}</p></div>
              ))}
            </div>
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl p-4 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
              <div><p className="font-semibold text-green-800 text-sm">Verified Certificate</p><p className="text-xs text-green-600 font-mono">{cert.certificate_number}</p></div>
              <Shield className="w-6 h-6 text-green-400 ml-auto" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <Link href="/" className="flex items-center gap-2 text-sm text-gray-500"><img src="/bloomy-logo.jpg" alt="Bloomy" className="w-6 h-6 object-cover rounded" />bloomy360.com</Link>
              <p className="text-xs text-gray-400">ID: {cert.certificate_number}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
