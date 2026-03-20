import Link from 'next/link'
import { BookOpen, Shield, BarChart3, Cloud, Code, Monitor, ArrowRight, GraduationCap, Award, Users } from 'lucide-react'

const tracks = [
  { icon: Cloud, title: 'Linux, DevOps & Cloud', color: 'bg-purple-100 text-purple-700', border: 'border-purple-100', slug: 'linux-devops-cloud-engineering' },
  { icon: Shield, title: 'Cybersecurity & Ethical Hacking', color: 'bg-red-100 text-red-700', border: 'border-red-100', slug: 'cybersecurity-ethical-hacking' },
  { icon: BarChart3, title: 'Data Analysis', color: 'bg-orange-100 text-orange-700', border: 'border-orange-100', slug: 'data-analysis-excel-sql-powerbi' },
  { icon: Code, title: 'Full-Stack Web Development', color: 'bg-green-100 text-green-700', border: 'border-green-100', slug: 'full-stack-web-development' },
  { icon: Monitor, title: 'Cloud Computing', color: 'bg-blue-100 text-blue-700', border: 'border-blue-100', slug: 'cloud-computing' },
  { icon: BookOpen, title: 'Product Management', color: 'bg-pink-100 text-pink-700', border: 'border-pink-100', slug: 'product-management' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bloomy-gradient rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">B</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">BloomyLMS</p>
              <p className="text-xs text-gray-400 leading-tight">Bloomy Technologies</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-5">
              Enroll Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — portal style */}
      <main className="flex-1">
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-16 text-center">
            {/* Logo large */}
            <div className="w-20 h-20 bloomy-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>

            <div className="inline-flex items-center gap-2 bg-bloomy-50 text-bloomy-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-bloomy-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Enrollment Open — April 2026 Cohort
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Welcome to <span className="bloomy-gradient-text">BloomyLMS</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto mb-8">
              The official learning portal for Bloomy Technologies. Access your courses, track progress, and earn industry certificates.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/login" className="btn-primary flex items-center gap-2 px-8 py-3 text-base">
                Access Portal <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/register" className="btn-secondary flex items-center gap-2 px-8 py-3 text-base">
                Create Account
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 mt-10 pt-8 border-t border-gray-100 flex-wrap">
              {[
                { icon: Users, value: '1,000+', label: 'Students Trained' },
                { icon: BookOpen, value: '6', label: 'Course Tracks' },
                { icon: Award, value: '4+', label: 'Countries' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-2 text-sm">
                  <stat.icon className="w-4 h-4 text-bloomy-500" />
                  <span className="font-bold text-gray-900">{stat.value}</span>
                  <span className="text-gray-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Tracks */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Course Tracks</h2>
            <p className="text-gray-500 text-sm">12-week intensive programs taught by industry experts</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {tracks.map(track => (
              <Link key={track.slug} href={`/courses/${track.slug}`}
                className={`bg-white rounded-xl border ${track.border} p-5 flex items-center gap-3 hover:shadow-md transition-all group`}>
                <div className={`w-10 h-10 ${track.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <track.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-bloomy-700 transition-colors">{track.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">12 weeks</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-bloomy-500 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* Portal features */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
              {[
                {
                  icon: '🎥',
                  title: 'Video Lessons',
                  desc: 'Watch recorded and live classes at your own pace, with full progress tracking.',
                },
                {
                  icon: '📝',
                  title: 'Quizzes & Assignments',
                  desc: 'Test your knowledge with auto-graded quizzes and submit assignments for review.',
                },
                {
                  icon: '🏆',
                  title: 'Certificates',
                  desc: 'Earn verified certificates on completion, shareable on LinkedIn and CVs.',
                },
              ].map(f => (
                <div key={f.title} className="p-6 text-center">
                  <span className="text-3xl block mb-3">{f.icon}</span>
                  <h3 className="font-semibold text-gray-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="bloomy-gradient rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Ready to start your tech journey?</h2>
            <p className="text-white/70 text-sm mb-6">Sign in to access your courses or create a new student account.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/login" className="bg-white text-bloomy-700 font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Sign In
              </Link>
              <Link href="/register" className="border border-white/40 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bloomy-gradient rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span className="text-sm text-gray-500">BloomyLMS — Bloomy Technologies</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <span>54B Adeniyi Jones Ave, Ikeja, Lagos</span>
            <span>+234 913 464 4911</span>
            <a href="https://bloomy360.com" target="_blank" rel="noopener noreferrer" className="hover:text-bloomy-600 transition-colors">bloomy360.com</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
