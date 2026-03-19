import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Award, CheckCircle, Calendar, User, BookOpen, Shield } from 'lucide-react'
import { format } from 'date-fns'

export default async function CertificateVerifyPage({ params }: { params: { number: string } }) {
  const supabase = await createClient()

  const { data: cert } = await supabase
    .from('certificates')
    .select(`
      *,
      student:profiles(full_name, email),
      course:courses(title, duration_weeks, category:categories(name, icon), instructor:profiles(full_name))
    `)
    .eq('certificate_number', params.number)
    .eq('status', 'issued')
    .single()

  if (!cert) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-bloomy-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Certificate card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-bloomy-100">
          {/* Header */}
          <div className="bloomy-gradient p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5" />
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-yellow-300" />
              </div>
              <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-1">Certificate of Completion</p>
              <h1 className="text-white text-3xl font-bold">BloomyLMS</h1>
              <p className="text-white/60 text-sm mt-1">by Bloomy Technologies</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-500 text-sm mb-2">This is to certify that</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{(cert.student as any)?.full_name}</h2>
              <p className="text-gray-500 text-sm">has successfully completed</p>
              <h3 className="text-xl font-bold text-bloomy-700 mt-2">{(cert.course as any)?.title}</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: Calendar, label: 'Issued', value: format(new Date(cert.issued_at), 'MMMM d, yyyy') },
                { icon: BookOpen, label: 'Duration', value: `${(cert.course as any)?.duration_weeks} Weeks` },
                { icon: User, label: 'Instructor', value: (cert.course as any)?.instructor?.full_name },
              ].map(item => (
                <div key={item.label} className="text-center bg-gray-50 rounded-xl p-4">
                  <item.icon className="w-5 h-5 text-bloomy-400 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Verification badge */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-2xl p-4 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800 text-sm">Verified Certificate</p>
                <p className="text-xs text-green-600 font-mono mt-0.5">{cert.certificate_number}</p>
              </div>
              <div className="ml-auto">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <div className="w-6 h-6 bloomy-gradient rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">B</span>
                </div>
                bloomy360.com
              </Link>
              <p className="text-xs text-gray-400">Certificate ID: {cert.certificate_number}</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Verify at <span className="font-medium text-bloomy-600">lms.bloomy360.com/certificate/{cert.certificate_number}</span>
        </p>
      </div>
    </div>
  )
}
