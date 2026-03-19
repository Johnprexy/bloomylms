# BloomyLMS 🎓

> **Professional Learning Management System for Bloomy Technologies**
> Built with Next.js 14, TypeScript, Neon PostgreSQL, NextAuth.js, Tailwind CSS

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Johnprexy/bloomylms)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS v3 |
| Auth | NextAuth.js v4 (email/password + Google OAuth) |
| Database | **Neon PostgreSQL** (free forever) |
| Payments | Paystack (NGN) + Stripe (USD) |
| Email | Resend |
| Deployment | Vercel (free tier) |

**Total monthly cost: $0** 🎉

---

## ✨ Features

### 👨‍🎓 Student Portal
- Browse & enroll in courses (free and paid)
- Full video course player with progress tracking
- Quiz engine with auto-grading
- Certificate download on completion
- Live session joining
- Discussion forums
- Notification centre
- Onboarding flow

### 👨‍🏫 Instructor Dashboard
- Multi-step course builder (modules + lessons)
- Student roster management
- Revenue & analytics charts
- Assignment grading

### 🛡️ Admin Panel
- Full user management (roles, suspend/activate)
- Course approval & publish controls
- Payment reconciliation
- Platform analytics with charts
- Cohort management
- System settings

---

## ⚡ Quick Deploy (5 minutes)

### Step 1 — Create Neon Database (Free)

1. Go to **[neon.tech](https://neon.tech)** → Sign up free
2. Create a new project → copy your **Connection String** (DATABASE_URL)
3. Open the **SQL Editor** → paste and run `neon/schema.sql`

### Step 2 — Deploy to Vercel

1. Fork this repo or import at **[vercel.com/new](https://vercel.com/new)**
2. Add these **Environment Variables** in Vercel:

```env
# Required
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=any-random-32-char-string-here
NEXTAUTH_URL=https://your-app.vercel.app

# Payments (get from paystack.com — free account)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxx
PAYSTACK_SECRET_KEY=sk_test_xxxx

# Optional — Email (resend.com free tier: 100 emails/day)
RESEND_API_KEY=re_xxxx

# Optional — Google OAuth (console.cloud.google.com)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxx
```

3. Click **Deploy** → live in ~2 minutes ✅

### Step 3 — Make Yourself Admin

In Neon SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### Step 4 — Add Seed Data (Optional)

Run `neon/seed.sql` to get 4 demo courses pre-loaded.

---

## 📁 Project Structure

```
bloomylms/
├── neon/
│   ├── schema.sql          ← Run this first in Neon SQL Editor
│   └── seed.sql            ← Optional demo data
├── src/
│   ├── app/
│   │   ├── (auth)/         ← Login, Register, Forgot Password
│   │   ├── (dashboard)/    ← Student portal
│   │   ├── (instructor)/   ← Instructor portal
│   │   ├── (admin)/        ← Admin panel
│   │   ├── api/            ← All API routes
│   │   └── certificate/    ← Public cert verification
│   ├── components/
│   │   ├── admin/
│   │   ├── instructor/
│   │   ├── layout/         ← Sidebar, TopBar
│   │   └── student/        ← CoursePlayer, QuizComponent
│   └── lib/
│       ├── auth.ts         ← NextAuth config
│       ├── db.ts           ← Neon SQL client
│       ├── email.ts        ← Resend email service
│       └── actions/        ← Server Actions
└── .env.example
```

---

## 👤 User Roles

| Role | Access |
|------|--------|
| `student` | Dashboard, courses, certificates, profile |
| `instructor` | + Course builder, students, analytics |
| `admin` | Full platform access |

---

## 🗄️ Database

Schema is in `neon/schema.sql`. Key tables:
- `users` — all users (students, instructors, admins)
- `courses` + `modules` + `lessons` — course content
- `enrollments` + `lesson_progress` — student tracking
- `payments` — Paystack payment records
- `certificates` — auto-numbered certificates
- `quizzes` + `quiz_attempts` — assessment engine
- `notifications` + `discussions` — engagement

---

## 🛠️ Local Development

```bash
git clone https://github.com/Johnprexy/bloomylms.git
cd bloomylms
npm install
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🌐 Setting Up Paystack Webhook

In your Paystack dashboard → Settings → Webhooks:
```
https://your-app.vercel.app/api/payments/paystack/webhook
```

---

## 🛠️ Built by

**John Ayomide Akinola**
DevOps & Cloud Engineer | Instructor at Bloomy Technologies | MD @ Swelerion Global Ltd
- GitHub: [github.com/Johnprexy](https://github.com/Johnprexy)
- LinkedIn: [linkedin.com/in/john-ayomide-akinola](https://linkedin.com/in/john-ayomide-akinola)

---

## 📄 License

MIT © 2026 Bloomy Technologies
