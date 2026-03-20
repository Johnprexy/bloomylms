import Link from 'next/link'
import { ArrowRight, BookOpen, Shield, BarChart3, Cloud, Code, Monitor, CheckCircle, Users, Award, Clock } from 'lucide-react'

const tracks = [
  { icon: Cloud, title: 'Linux, DevOps & Cloud', tag: 'Most Popular', slug: 'linux-devops-cloud-engineering', color: '#6C3DFF' },
  { icon: Shield, title: 'Cybersecurity & Ethical Hacking', tag: 'High Demand', slug: 'cybersecurity-ethical-hacking', color: '#ef4444' },
  { icon: BarChart3, title: 'Data Analysis', tag: 'Beginner Friendly', slug: 'data-analysis-excel-sql-powerbi', color: '#f97316' },
  { icon: Code, title: 'Full-Stack Web Dev', tag: 'Project-Based', slug: 'full-stack-web-development', color: '#10b981' },
  { icon: Monitor, title: 'Cloud Computing', tag: 'AWS & Azure', slug: 'cloud-computing', color: '#3b82f6' },
  { icon: BookOpen, title: 'Product Management', tag: 'Business + Tech', slug: 'product-management', color: '#8b5cf6' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', system-ui, sans-serif; }
        .glow { box-shadow: 0 0 60px rgba(108,61,255,0.35); }
        .card-glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px); }
        .hero-glow { background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,61,255,0.3), transparent); }
        .track-card:hover { background: rgba(255,255,255,0.07); transform: translateY(-2px); }
        .track-card { transition: all 0.2s ease; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-slow { 0%,100%{opacity:0.6} 50%{opacity:1} }
        .float { animation: float 4s ease-in-out infinite; }
        .pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .stat-card { background: linear-gradient(135deg, rgba(108,61,255,0.12), rgba(58,94,255,0.06)); border: 1px solid rgba(108,61,255,0.2); }
      `}</style>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6C3DFF,#3a5eff)' }}>
              <span className="text-white font-bold text-sm font-display">B</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none font-display">BloomyLMS</p>
              <p className="text-xs leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Bloomy Technologies</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = 'white'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}>
              Sign In
            </Link>
            <Link href="/register"
              className="text-sm font-semibold px-5 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#6C3DFF,#3a5eff)', color: 'white' }}>
              Enroll Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="hero-glow absolute inset-0 pointer-events-none" />

        {/* Floating orbs */}
        <div className="absolute top-24 left-1/4 w-72 h-72 rounded-full pointer-events-none float" style={{ background: 'radial-gradient(circle, rgba(108,61,255,0.15), transparent 70%)' }} />
        <div className="absolute top-40 right-1/4 w-48 h-48 rounded-full pointer-events-none float" style={{ background: 'radial-gradient(circle, rgba(58,94,255,0.12), transparent 70%)', animationDelay: '2s' }} />

        <div className="max-w-5xl mx-auto text-center relative">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium" style={{ background: 'rgba(108,61,255,0.15)', border: '1px solid rgba(108,61,255,0.3)', color: '#a78bfa' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 pulse-slow" />
            April 2026 Cohort — Enrollment Open
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            Welcome to{' '}
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6C3DFF, #3a5eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Bloomy
            </span>
            {' '}Learning Portal
          </h1>

          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 300 }}>
            The official LMS for Bloomy Technologies. Master in-demand tech skills with expert instructors, hands-on labs, and industry certificates.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
            <Link href="/register"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:scale-105 glow"
              style={{ background: 'linear-gradient(135deg,#6C3DFF,#3a5eff)', color: 'white' }}>
              Start Learning Free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}>
              Student Login
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: '1,000+', label: 'Graduates', icon: Users },
              { value: '6', label: 'Tech Tracks', icon: BookOpen },
              { value: '4+', label: 'Countries', icon: Award },
            ].map(stat => (
              <div key={stat.label} className="stat-card rounded-2xl py-4 px-3 text-center">
                <p className="font-display text-2xl font-bold text-white mb-0.5">{stat.value}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Students Visual Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #6C3DFF 0%, #1a0a4a 50%, #0a0a0f 100%)', minHeight: 320 }}>
            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 grid md:grid-cols-2 gap-0 h-full min-h-80">
              {/* Left text */}
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <p className="text-sm font-semibold mb-3 tracking-widest uppercase" style={{ color: 'rgba(167,139,250,0.8)' }}>For Tech Professionals</p>
                <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-5 text-white leading-tight">
                  Learn skills that<br />get you hired.
                </h2>
                <div className="space-y-3">
                  {[
                    'Hands-on labs and real-world projects',
                    'Live classes with industry experts',
                    'Job placement support included',
                    'Globally recognised certificates',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#a78bfa' }} />
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register"
                  className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl font-semibold text-sm w-fit transition-all hover:opacity-90"
                  style={{ background: 'white', color: '#6C3DFF' }}>
                  Join the next cohort <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right — tech student visual */}
              <div className="relative flex items-center justify-center p-10 md:p-8">
                {/* Abstract laptop/code visual */}
                <div className="relative">
                  {/* Laptop screen */}
                  <div className="w-64 h-44 rounded-2xl relative overflow-hidden" style={{ background: '#0a0a0f', border: '3px solid rgba(255,255,255,0.15)' }}>
                    {/* Code lines */}
                    <div className="absolute inset-0 p-4 font-mono text-xs leading-6 overflow-hidden">
                      {[
                        { text: '$ kubectl get pods', color: '#a78bfa' },
                        { text: 'NAME    READY   STATUS', color: 'rgba(255,255,255,0.3)' },
                        { text: 'app-1   1/1     Running ✓', color: '#34d399' },
                        { text: 'app-2   1/1     Running ✓', color: '#34d399' },
                        { text: '$ docker build -t app .', color: '#a78bfa' },
                        { text: 'Successfully built 🎉', color: '#fbbf24' },
                      ].map((line, i) => (
                        <div key={i} style={{ color: line.color, animationDelay: `${i * 0.15}s` }} className="animate-fade-in">{line.text}</div>
                      ))}
                    </div>
                    {/* Scanline effect */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)' }} />
                  </div>
                  {/* Laptop base */}
                  <div className="w-72 h-3 mx-auto -mt-1 rounded-b-xl" style={{ background: 'rgba(255,255,255,0.1)' }} />

                  {/* Floating badges */}
                  <div className="absolute -top-4 -right-8 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
                    ✓ AWS Certified
                  </div>
                  <div className="absolute -bottom-2 -left-6 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                    🏆 Certificate Earned
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Tracks */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#a78bfa' }}>6 Course Tracks</p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white">Choose your path</h2>
            <p className="mt-3 text-base max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
              12-week intensive programs, beginner to expert.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {tracks.map(track => (
              <Link key={track.slug} href={`/courses/${track.slug}`}
                className="track-card card-glass rounded-2xl p-5 flex flex-col gap-3 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${track.color}20` }}>
                    <track.icon className="w-5 h-5" style={{ color: track.color }} />
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                    {track.tag}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm leading-snug">{track.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Clock className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>12 weeks</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium" style={{ color: track.color }}>
                  View course <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="card-glass rounded-3xl p-12">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg,#6C3DFF,#3a5eff)' }}>
              <Award className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display text-3xl font-extrabold text-white mb-3">
              Ready to transform your career?
            </h2>
            <p className="mb-8 max-w-sm mx-auto text-base" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Join 1,000+ graduates from Bloomy Technologies now working at top tech companies across Africa and beyond.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/register"
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-semibold transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#6C3DFF,#3a5eff)', color: 'white' }}>
                Create Free Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login"
                className="px-8 py-3.5 rounded-2xl font-semibold transition-all hover:bg-white/10"
                style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6C3DFF,#3a5eff)' }}>
              <span className="text-white font-bold text-xs font-display">B</span>
            </div>
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>BloomyLMS · Bloomy Technologies</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>Ikeja, Lagos · Nigeria</span>
            <span>+234 913 464 4911</span>
            <a href="https://bloomy360.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">bloomy360.com ↗</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
