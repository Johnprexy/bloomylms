// BloomyLMS Email — uses Resend SDK (lazy init to avoid build-time errors)

const APP_URL = process.env.NEXTAUTH_URL || 'https://bloomylms.vercel.app'

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not set — skipping')
    return { success: false }
  }
  try {
    // Lazy import so Resend doesn't init at build time
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.EMAIL_FROM || 'Bloomy Technologies LMS <onboarding@resend.dev>'
    const { data, error } = await resend.emails.send({ from, to, subject, html })
    if (error) { console.error('[Email] Resend error:', error); return { success: false } }
    console.log('[Email] Sent OK:', data?.id, '→', to)
    return { success: true }
  } catch (err) {
    console.error('[Email] Exception:', err)
    return { success: false }
  }
}

export async function sendInvitationEmail(to: string, name: string, courseName: string, setupUrl: string) {
  return sendEmail({
    to,
    subject: `You've been enrolled at Bloomy Technologies LMS 🎓`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#6C3DFF,#3a5eff);padding:36px 40px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:24px;font-weight:700;">Bloomy Technologies LMS</h1>
    <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">Your learning portal is ready</p>
  </td></tr>
  <tr><td style="padding:36px 40px;">
    <h2 style="color:#111827;margin:0 0 12px;">Hi ${name || 'there'}! 👋</h2>
    <p style="color:#6b7280;line-height:1.7;font-size:15px;margin:0 0 24px;">
      You have been enrolled in <strong style="color:#111827;">${courseName}</strong> at Bloomy Technologies.
      Click below to set your password and start learning.
    </p>
    <div style="background:#f0f4ff;border:1px solid #c7d7ff;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Enrolled Course</p>
      <p style="margin:6px 0 0;font-size:15px;color:#111827;font-weight:700;">📚 ${courseName}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">This link is valid for <strong>48 hours</strong>.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${setupUrl}" style="background:linear-gradient(135deg,#6C3DFF,#3a5eff);color:white;padding:15px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">
        Activate My Account →
      </a>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;">Or paste this link in your browser:</p>
    <p style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;font-size:11px;color:#6b7280;word-break:break-all;font-family:monospace;margin:0 0 24px;">${setupUrl}</p>
    <p style="color:#9ca3af;font-size:12px;margin:0;">Questions? <a href="mailto:support@bloomy360.com" style="color:#6C3DFF;">support@bloomy360.com</a></p>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:16px 40px;text-align:center;border-top:1px solid #f3f4f6;">
    <p style="color:#9ca3af;font-size:11px;margin:0;">© 2026 Bloomy Technologies · Ikeja, Lagos</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  })
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: 'Reset your BloomyLMS password',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#6C3DFF,#3a5eff);padding:32px;border-radius:16px;text-align:center;margin-bottom:32px;">
        <h1 style="color:white;margin:0;font-size:22px;">Reset Your Password</h1>
      </div>
      <p style="color:#6b7280;line-height:1.7;">Click below to reset your password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="background:#6C3DFF;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;">Reset Password</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;">Didn't request this? Ignore this email.</p>
    </div>`,
  })
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    to,
    subject: 'Welcome to BloomyLMS! 🎓',
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#6C3DFF,#3a5eff);padding:36px;border-radius:16px;text-align:center;margin-bottom:28px;">
        <h1 style="color:white;margin:0;font-size:26px;">Welcome to BloomyLMS!</h1>
      </div>
      <h2 style="color:#111827;">Hi ${name}! 👋</h2>
      <p style="color:#6b7280;line-height:1.7;">Your account is ready. Access courses in DevOps, Cloud, Cybersecurity, Data Analysis and Web Development.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/courses" style="background:#6C3DFF;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;">Explore Courses →</a>
      </div>
    </div>`,
  })
}

export async function sendEnrollmentConfirmation(to: string, name: string, courseName: string) {
  return sendEmail({
    to,
    subject: `You're enrolled in ${courseName}! 🎉`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#6C3DFF,#3a5eff);padding:32px;border-radius:16px;text-align:center;margin-bottom:28px;">
        <h1 style="color:white;margin:0;font-size:22px;">Enrollment Confirmed! 🎉</h1>
      </div>
      <p style="color:#6b7280;line-height:1.7;">Hi ${name}, you're enrolled in <strong style="color:#111827;">${courseName}</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${APP_URL}/dashboard" style="background:#6C3DFF;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;">Go to Dashboard →</a>
      </div>
    </div>`,
  })
}

export async function sendCertificateEmail(to: string, name: string, courseName: string, certNumber: string) {
  return sendEmail({
    to,
    subject: `Your certificate for ${courseName} is ready! 🏆`,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
      <div style="background:linear-gradient(135deg,#6C3DFF,#3a5eff);padding:32px;border-radius:16px;text-align:center;margin-bottom:28px;">
        <div style="font-size:48px;margin-bottom:8px;">🏆</div>
        <h1 style="color:white;margin:0;">Certificate of Completion</h1>
      </div>
      <p style="color:#6b7280;">Congratulations <strong>${name}</strong>! You completed <strong style="color:#111827;">${courseName}</strong>.</p>
      <div style="background:#f0f4ff;border:1px solid #c7d7ff;border-radius:12px;padding:18px;margin:24px 0;text-align:center;">
        <p style="color:#6C3DFF;font-weight:700;font-size:18px;font-family:monospace;margin:0;">${certNumber}</p>
      </div>
      <div style="text-align:center;">
        <a href="${APP_URL}/certificate/${certNumber}" style="background:#6C3DFF;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;">View Certificate →</a>
      </div>
    </div>`,
  })
}
