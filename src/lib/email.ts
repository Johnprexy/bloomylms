// BloomyLMS Email Service — powered by Resend
// Install: npm install resend

interface EmailOptions {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping email send')
    return { success: false }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'BloomyLMS <noreply@bloomy360.com>',
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[Email] Send failed:', err)
    return { success: false }
  }

  return { success: true }
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Welcome to BloomyLMS! 🎓',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #6C3DFF, #3a5eff); padding: 40px; border-radius: 16px; text-align: center; margin-bottom: 32px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to BloomyLMS!</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Start your tech journey today</p>
        </div>
        <h2 style="color: #111827;">Hi ${name}! 👋</h2>
        <p style="color: #6b7280; line-height: 1.6;">
          Your BloomyLMS account is ready. You now have access to world-class tech courses in DevOps, Cloud, Cybersecurity, Data Analysis, and Web Development.
        </p>
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <h3 style="color: #374151; margin-top: 0;">What you can do now:</h3>
          <ul style="color: #6b7280; line-height: 2;">
            <li>Browse our course catalog</li>
            <li>Enroll in your first course</li>
            <li>Track your learning progress</li>
            <li>Earn industry certificates</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/courses"
             style="background: #6C3DFF; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Explore Courses →
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 14px; text-align: center;">
          Questions? Email us at <a href="mailto:support@bloomy360.com" style="color: #6C3DFF;">support@bloomy360.com</a>
        </p>
      </div>
    `,
  })
}

export async function sendEnrollmentConfirmation(to: string, name: string, courseName: string) {
  return sendEmail({
    to,
    subject: `You're enrolled in ${courseName}! 🎉`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #6C3DFF, #3a5eff); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 32px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Enrollment Confirmed!</h1>
        </div>
        <h2 style="color: #111827;">Hi ${name}!</h2>
        <p style="color: #6b7280; line-height: 1.6;">
          You're now enrolled in <strong style="color: #111827;">${courseName}</strong>. Your learning journey starts now!
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
             style="background: #6C3DFF; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Start Learning →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendCertificateEmail(to: string, name: string, courseName: string, certNumber: string) {
  const certUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificate/${certNumber}`
  return sendEmail({
    to,
    subject: `Your certificate for ${courseName} is ready! 🏆`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #6C3DFF, #3a5eff); padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 32px;">
          <div style="font-size: 48px; margin-bottom: 8px;">🏆</div>
          <h1 style="color: white; margin: 0; font-size: 24px;">Certificate of Completion</h1>
        </div>
        <h2 style="color: #111827;">Congratulations, ${name}!</h2>
        <p style="color: #6b7280; line-height: 1.6;">
          You have successfully completed <strong style="color: #111827;">${courseName}</strong>. Your certificate is ready.
        </p>
        <div style="background: #f0f4ff; border: 1px solid #c7d7ff; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="color: #4b5563; margin: 0 0 4px; font-size: 13px;">Certificate ID</p>
          <p style="color: #6C3DFF; font-weight: 700; font-size: 18px; font-family: monospace; margin: 0;">${certNumber}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${certUrl}" style="background: #6C3DFF; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View & Download Certificate →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: 'Reset your BloomyLMS password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #111827;">Reset your password</h2>
        <p style="color: #6b7280;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #6C3DFF; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}
