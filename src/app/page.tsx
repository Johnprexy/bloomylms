import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle, Users, BookOpen, Award, Star, Clock, TrendingUp, Shield, Code, BarChart3, Cloud } from 'lucide-react'

const courses = [
  { icon: Cloud, title: 'Linux, DevOps & Cloud', weeks: 12, students: '1,000+', level: 'Beginner', tags: ['AWS', 'Docker', 'K8s', 'Jenkins'], color: 'from-purple-600 to-blue-600', slug: 'linux-devops-cloud' },
  { icon: Shield, title: 'Cybersecurity & Ethical Hacking', weeks: 12, students: '800+', level: 'Beginner', tags: ['Pen Testing', 'SIEM', 'Network Sec'], color: 'from-red-500 to-orange-500', slug: 'cybersecurity' },
  { icon: BarChart3, title: 'Data Analysis', weeks: 12, students: '600+', level: 'Beginner', tags: ['Excel', 'SQL', 'Power BI', 'Python'], color: 'from-orange-500 to-yellow-500', slug: 'data-analysis' },
  { icon: Code, title: 'Full-Stack Web Development', weeks: 12, students: '500+', level: 'Beginner', tags: ['React', 'Node.js', 'PostgreSQL'], color: 'from-green-500 to-teal-500', slug: 'web-development' },
]

const stats = [
  { value: '1,000+', label: 'Graduates', icon: Users },
  { value: '15+', label: 'Years Experience', icon: TrendingUp },
  { value: '4+', label: 'Countries', icon: Award },
  { value: '6', label: 'Tech Courses', icon: BookOpen },
]

const testimonials = [
  { name: 'Chioma Okafor', role: 'DevOps Engineer @ Flutterwave', text: 'BloomyLMS gave me the structure I needed. The hands-on labs and assignments were exactly what employers look for.', rating: 5 },
  { name: 'Emeka Nwosu', role: 'Cloud Architect @ Paystack', text: 'The course content is production-grade. I landed my role within 3 months of completing the DevOps track.', rating: 5 },
  { name: 'Amara Diallo', role: 'Security Analyst @ Interswitch', text: 'The cybersecurity curriculum is world-class. Real labs, real scenarios, real results.', rating: 5 },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bloomy-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-gray-900">BloomyLMS</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/courses" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Courses</Link>
              <Link href="/#about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</Link>
              <Link href="https://bloomy360.com" target="_blank" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">bloomy360.com</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
              <Link href="/register" className="btn-primary text-sm py-2">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-bloomy-50 via-white to-blue-50 -z-10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-bloomy-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-bloomy-50 text-bloomy-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-bloomy-100">
                <span className="w-1.5 h-1.5 bg-bloomy-600 rounded-full animate-pulse" />
                🎓 Enrollment Open for 2026 Cohort
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Launch Your{' '}
                <span className="bloomy-gradient-text">Tech Career</span>{' '}
                with Expert Training
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join 1,000+ graduates who transformed their careers. Expert-led training in Linux, DevOps, Cloud, Cybersecurity, Data Analysis and more — with real projects and job support.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <Link href="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
                  Start Learning Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/courses" className="btn-secondary flex items-center gap-2 text-base px-8 py-3">
                  Explore Courses
                </Link>
              </div>
              <div className="flex flex-wrap gap-6">
                {[
                  'Job placement support',
                  'Industry certifications',
                  'Hands-on projects',
                  'Live classes',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero card */}
            <div className="relative animate-slide-up">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bloomy-gradient rounded-xl flex items-center justify-center">
                      <Cloud className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Linux, DevOps & Cloud</p>
                      <p className="text-xs text-gray-500">12 weeks • Expert level</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-1 rounded-full">Enrolling Now</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Course Progress</span>
                    <span className="font-medium text-bloomy-600">85%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-bloomy-gradient rounded-full w-[85%] progress-bar" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'Linux'].map(tag => (
                    <span key={tag} className="text-xs bg-bloomy-50 text-bloomy-700 font-medium px-2 py-1 rounded-md text-center">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                    <span className="text-xs text-gray-500 ml-1">4.9 (234 reviews)</span>
                  </div>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 1,000+ enrolled</span>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100 z-20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Certificate Issued</p>
                    <p className="text-xs text-gray-500">BT-2025-001542</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3 border border-gray-100 z-20">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {['C', 'E', 'A'].map((l, i) => (
                      <div key={i} className="w-6 h-6 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">{l}</div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 font-medium">+24 joined today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 bloomy-gradient rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-bloomy-600 font-semibold text-sm mb-2">🎓 Popular Courses</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Transform Your Career</h2>
            <p className="text-gray-600 max-w-xl mx-auto">Expert-designed programs that get you job-ready in weeks, not years.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map(course => (
              <Link key={course.slug} href={`/courses/${course.slug}`} className="course-card bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl group">
                <div className={`h-32 bg-gradient-to-br ${course.color} flex items-center justify-center`}>
                  <course.icon className="w-12 h-12 text-white/90" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug group-hover:text-bloomy-700 transition-colors">{course.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.weeks} weeks</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.students}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {course.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md">{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-green-50 text-green-700 font-medium px-2 py-1 rounded-md">{course.level}</span>
                    <span className="text-bloomy-600 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Enroll <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/courses" className="btn-secondary inline-flex items-center gap-2">View All Courses <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-bloomy-600 font-semibold text-sm mb-2">💬 Success Stories</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Graduates Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bloomy-gradient rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bloomy-gradient rounded-3xl p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/5 rounded-3xl" />
            <h2 className="text-4xl font-bold mb-4 relative">Ready to Start Your Tech Journey?</h2>
            <p className="text-white/80 mb-8 text-lg relative">Join our next cohort. Limited spots available.</p>
            <div className="flex flex-wrap justify-center gap-4 relative">
              <Link href="/register" className="bg-white text-bloomy-700 font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                Enroll Today <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/courses" className="border border-white/40 text-white font-medium px-8 py-3 rounded-lg hover:bg-white/10 transition-colors">
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bloomy-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-white">BloomyLMS</span>
            </div>
            <p className="text-sm leading-relaxed">Professional learning management system by Bloomy Technologies. Empowering the next generation of tech professionals.</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Courses</p>
            {['Linux & DevOps', 'Cybersecurity', 'Data Analysis', 'Web Development'].map(c => (
              <Link key={c} href="/courses" className="block text-sm hover:text-white transition-colors mb-2">{c}</Link>
            ))}
          </div>
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Company</p>
            {[['About', 'https://bloomy360.com/about'], ['Blog', 'https://bloomy360.com/blog'], ['Careers', 'https://bloomy360.com/careers'], ['Contact', 'https://bloomy360.com/contact']].map(([label, href]) => (
              <Link key={label} href={href} className="block text-sm hover:text-white transition-colors mb-2">{label}</Link>
            ))}
          </div>
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Contact</p>
            <p className="text-sm mb-2">54B Adeniyi Jones Ave, Ikeja, Lagos</p>
            <p className="text-sm mb-2">+234 913 464 4911</p>
            <p className="text-sm">contact@bloomy360.com</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          © {new Date().getFullYear()} Bloomy Technologies. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
