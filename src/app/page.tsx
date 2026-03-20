import Link from 'next/link'
import { ArrowRight, BookOpen, Shield, BarChart3, Cloud, Code, Monitor, CheckCircle, Users, Award, Clock } from 'lucide-react'

const tracks = [
  { icon: Cloud, title: 'Linux, DevOps & Cloud', tag: 'Most Popular', slug: 'linux-devops-cloud-engineering', color: '#6C3DFF', bg: 'rgba(108,61,255,0.15)' },
  { icon: Shield, title: 'Cybersecurity & Ethical Hacking', tag: 'High Demand', slug: 'cybersecurity-ethical-hacking', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { icon: BarChart3, title: 'Data Analysis', tag: 'Beginner Friendly', slug: 'data-analysis-excel-sql-powerbi', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  { icon: Code, title: 'Full-Stack Web Dev', tag: 'Project-Based', slug: 'full-stack-web-development', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { icon: Monitor, title: 'Cloud Computing', tag: 'AWS & Azure', slug: 'cloud-computing', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { icon: BookOpen, title: 'Product Management', tag: 'Business + Tech', slug: 'product-management', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#0a0a0f', color: 'white', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
        .font-display { font-family: 'Syne', system-ui, sans-serif !important; }
        .glow-btn { box-shadow: 0 0 40px rgba(108,61,255,0.4); }
        .card-glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
        .card-glass:hover { background: rgba(255,255,255,0.07); transform: translateY(-2px); }
        .card-glass { transition: all 0.2s ease; }
        .nav-link { color: rgba(255,255,255,0.6); transition: color 0.2s; }
        .nav-link:hover { color: white; }
        .outline-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.8); transition: all 0.2s; }
        .outline-btn:hover { background: rgba(255,255,255,0.12); color: white; }
        .hero-glow { background: radial-gradient(ellipse 70% 40% at 50% 0%, rgba(108,61,255,0.25), transparent); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .float { animation: float 5s ease-in-out infinite; }
        .float-delay { animation: float 5s ease-in-out 2s infinite; }
        .cursor-blink { animation: blink 1s step-end infinite; }
        .stat-card { background: linear-gradient(135deg, rgba(108,61,255,0.1), rgba(58,94,255,0.05)); border: 1px solid rgba(108,61,255,0.2); }
        .green-dot { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 4px #22c55e} 50%{box-shadow:0 0 12px #22c55e} }
        .green-dot { animation: pulse-green 2s ease-in-out infinite; }
        .primary-btn { background: linear-gradient(135deg, #6C3DFF, #3a5eff); color: white; transition: all 0.2s; }
        .primary-btn:hover { opacity: 0.9; transform: scale(1.02); }
        .white-btn { background: white; color: #6C3DFF; transition: all 0.2s; }
        .white-btn:hover { background: #f5f3ff; }
        .track-icon { transition: transform 0.2s; }
        .card-glass:hover .track-icon { transform: scale(1.1); }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6C3DFF,#3a5eff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 15, fontFamily: 'Syne, system-ui' }}>B</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, color: 'white', fontSize: 14, margin: 0, fontFamily: 'Syne, system-ui' }}>BloomyLMS</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Bloomy Technologies</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/login" className="nav-link" style={{ fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '8px 16px', borderRadius: 10 }}>
              Sign In
            </Link>
            <Link href="/register" className="primary-btn" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '9px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              Enroll Free <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', paddingTop: 140, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div className="hero-glow" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

        {/* Orbs */}
        <div className="float" style={{ position: 'absolute', top: 100, left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,61,255,0.12), transparent 70%)', pointerEvents: 'none' }} />
        <div className="float-delay" style={{ position: 'absolute', top: 160, right: '20%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(58,94,255,0.1), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative' }}>

          {/* Live badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 50, background: 'rgba(108,61,255,0.12)', border: '1px solid rgba(108,61,255,0.25)', marginBottom: 32 }}>
            <span className="green-dot" style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>April 2026 Cohort — Enrollment Now Open</span>
          </div>

          {/* Main headline */}
          <h1 className="font-display" style={{ fontSize: 'clamp(40px, 7vw, 72px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-1px' }}>
            Welcome to{' '}
            <span style={{ background: 'linear-gradient(135deg, #c4b5fd, #6C3DFF, #3a5eff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Bloomy
            </span>
            {' '}Learning Portal
          </h1>

          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', marginBottom: 40, maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6, fontWeight: 300 }}>
            Your gateway to a tech career. Expert-led courses, hands-on labs, live classes, and industry certificates — all in one place.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/register" className="primary-btn glow-btn" style={{ fontSize: 16, fontWeight: 600, textDecoration: 'none', padding: '14px 32px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              Start Learning Free <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="outline-btn" style={{ fontSize: 16, fontWeight: 600, textDecoration: 'none', padding: '14px 32px', borderRadius: 16 }}>
              Student Login
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { value: '1,000+', label: 'Graduates' },
              { value: '6', label: 'Course Tracks' },
              { value: '12 Weeks', label: 'Per Program' },
              { value: '4+', label: 'Countries' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ borderRadius: 16, padding: '16px 24px', textAlign: 'center', minWidth: 110 }}>
                <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual feature section */}
      <section style={{ padding: '16px 24px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ borderRadius: 32, overflow: 'hidden', background: 'linear-gradient(135deg, #1a0a4a 0%, #0d0d1f 50%, #0a0a0f 100%)', border: '1px solid rgba(108,61,255,0.2)' }}>

            {/* Grid overlay */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0 }}>

                {/* Left — text */}
                <div style={{ padding: '56px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(167,139,250,0.7)', marginBottom: 16 }}>Built for tech professionals</p>
                  <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 24, lineHeight: 1.2 }}>
                    Learn skills that<br />
                    <span style={{ color: '#a78bfa' }}>get you hired.</span>
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
                    {[
                      'Hands-on labs with real infrastructure',
                      'Live weekly classes with instructors',
                      'Job placement assistance',
                      'Globally recognised certificates',
                      'DevOps, Cloud, Cyber, Data & more',
                    ].map(item => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/register" className="white-btn" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', padding: '12px 24px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content' }}>
                    Join the next cohort <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Right — terminal visual */}
                <div style={{ padding: '48px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '100%', maxWidth: 340 }}>

                    {/* Terminal */}
                    <div style={{ background: '#0a0a0f', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
                      {/* Terminal header */}
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', opacity: 0.8 }} />
                        <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>bloomy-student@lms</span>
                      </div>
                      {/* Terminal body */}
                      <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: 13, lineHeight: 2.2 }}>
                        {[
                          { text: '$ kubectl get nodes', color: '#a78bfa' },
                          { text: 'STATUS: Ready ✓', color: '#22c55e' },
                          { text: '$ docker ps -a', color: '#a78bfa' },
                          { text: 'app-container  Up 2h  ✓', color: '#22c55e' },
                          { text: '$ terraform apply', color: '#a78bfa' },
                          { text: 'Apply complete! 3 added ✓', color: '#22c55e' },
                          { text: '$ _', color: '#a78bfa' },
                        ].map((line, i) => (
                          <div key={i} style={{ color: line.color }}>{line.text}</div>
                        ))}
                      </div>
                    </div>

                    {/* Floating badges */}
                    <div style={{ position: 'absolute', top: -16, right: -16, padding: '8px 14px', borderRadius: 12, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', fontSize: 12, fontWeight: 600 }}>
                      ✓ AWS Certified
                    </div>
                    <div style={{ position: 'absolute', bottom: -12, left: -16, padding: '8px 14px', borderRadius: 12, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>
                      🏆 Certificate Earned
                    </div>
                    <div style={{ position: 'absolute', top: '40%', right: -24, padding: '8px 14px', borderRadius: 12, background: 'rgba(108,61,255,0.15)', border: '1px solid rgba(108,61,255,0.3)', color: '#a78bfa', fontSize: 12, fontWeight: 600 }}>
                      📈 Progress: 85%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Tracks */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#a78bfa', marginBottom: 12 }}>6 Course Tracks</p>
            <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: 'white', margin: 0 }}>Choose your path</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 12, maxWidth: 400, margin: '12px auto 0' }}>12-week intensive programs, beginner to expert level</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {tracks.map(track => (
              <Link key={track.slug} href={`/courses/${track.slug}`}
                className="card-glass"
                style={{ borderRadius: 20, padding: 24, textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div className="track-icon" style={{ width: 48, height: 48, borderRadius: 14, background: track.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <track.icon size={22} style={{ color: track.color }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                    {track.tag}
                  </span>
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'white', margin: 0, lineHeight: 1.4 }}>{track.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <Clock size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>12 weeks · Beginner friendly</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: track.color }}>
                  View course <ArrowRight size={13} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="card-glass" style={{ borderRadius: 32, padding: '64px 48px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#6C3DFF,#3a5eff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Award size={30} style={{ color: 'white' }} />
            </div>
            <h2 className="font-display" style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 12 }}>
              Ready to transform your career?
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.6 }}>
              Join 1,000+ graduates from Bloomy Technologies now working at top companies across Africa and beyond.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/register" className="primary-btn glow-btn" style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none', padding: '14px 32px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                Create Free Account <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="outline-btn" style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none', padding: '14px 32px', borderRadius: 16 }}>
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6C3DFF,#3a5eff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>B</span>
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>BloomyLMS · Bloomy Technologies</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>54B Adeniyi Jones Ave, Ikeja, Lagos</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>+234 913 464 4911</span>
            <a href="https://bloomy360.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>bloomy360.com ↗</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
