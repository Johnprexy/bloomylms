# BloomyLMS — Learning Management System

Professional LMS for **Bloomy Technologies** (bloomy360.com). Built with Next.js 14, Supabase, Tailwind CSS, and Paystack.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Supabase Edge Functions |
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (email/password, OAuth) |
| Storage | Supabase Storage (videos, PDFs, avatars) |
| Payments | Paystack (NGN) + Stripe (USD) |
| Email | Resend + React Email |
| Video CDN | Bunny.net / Mux |
| Deployment | Vercel (frontend) + Supabase Cloud |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register, Forgot Password
│   ├── (dashboard)/     # Student portal (courses, player, profile, certs)
│   ├── (instructor)/    # Instructor dashboard (courses, students, analytics)
│   ├── (admin)/         # Admin panel (users, courses, payments, analytics)
│   ├── api/             # API routes (enrollments, payments, certificates)
│   └── certificate/     # Public certificate verification
├── components/
│   ├── admin/           # Admin-specific components
│   ├── instructor/      # Instructor-specific components
│   ├── layout/          # Sidebar, TopBar
│   ├── student/         # CoursePlayer, EnrollButton
│   └── ui/              # Shared UI (Skeleton, Toaster)
├── lib/
│   ├── actions/         # Server actions (auth, courses, payments)
│   ├── supabase/        # Client, server, middleware helpers
│   └── utils.ts         # Utility functions
├── hooks/               # useAuth, custom hooks
├── store/               # Zustand global state
└── types/               # TypeScript type definitions
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Johnprexy/bloomylms.git
cd bloomylms
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in your values (see `.env.example`).

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/schema.sql`
3. Copy your project URL and keys to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🗄️ Database Setup

Run `supabase/schema.sql` in your Supabase SQL Editor. This creates:

- All tables (profiles, courses, modules, lessons, enrollments, payments, certificates, etc.)
- Row-Level Security policies
- Triggers (auto-create profile, progress tracking, certificate generation)
- Storage buckets

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Student** | Browse courses, enroll, learn, track progress, download certificates |
| **Instructor** | Create/manage courses, view students, analytics, revenue |
| **Admin** | Full platform control — users, courses, payments, analytics, settings |

### Making a user an admin

In Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 💳 Payment Setup

### Paystack (Nigerian Naira)
1. Get keys from [dashboard.paystack.com](https://dashboard.paystack.com)
2. Add webhook URL: `https://yourdomain.com/api/payments/paystack/webhook`
3. Events to listen: `charge.success`

### Stripe (International)
1. Get keys from [dashboard.stripe.com](https://dashboard.stripe.com)
2. Add webhook endpoint for `payment_intent.succeeded`

---

## 🎓 Course Structure

```
Course
├── Module 1
│   ├── Lesson 1 (video)
│   ├── Lesson 2 (text)
│   └── Lesson 3 (quiz)
├── Module 2
│   ├── Lesson 4 (video)
│   └── Lesson 5 (assignment)
└── Certificate (auto-issued on 100% completion)
```

---

## 🚢 Deployment

### Vercel
```bash
npm install -g vercel
vercel --prod
```

Add all environment variables in your Vercel project settings.

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `RESEND_API_KEY`

---

## 📋 Features

### Student Portal
- ✅ Registration & email verification
- ✅ Course catalogue with search & filters
- ✅ Course detail pages with curriculum preview
- ✅ Paystack & free enrollment
- ✅ Video course player with progress tracking
- ✅ Lesson resources & downloads
- ✅ Quiz & assignment submission
- ✅ Certificate generation & verification
- ✅ Notification system
- ✅ Profile management

### Instructor Dashboard
- ✅ Course builder (3-step wizard)
- ✅ Course editor (info, curriculum, settings)
- ✅ Student roster & progress
- ✅ Revenue analytics with charts
- ✅ Course publish/unpublish

### Admin Panel
- ✅ User management (roles, suspend/activate)
- ✅ Course management (approve, publish, archive)
- ✅ Payment records & reconciliation
- ✅ Platform analytics dashboard
- ✅ System settings

### API Routes
- ✅ `POST /api/enrollments` — Free course enrollment
- ✅ `POST /api/payments/paystack/webhook` — Paystack webhooks
- ✅ `POST /api/certificates/generate` — Certificate generation
- ✅ `GET /api/courses` — Course search with pagination

---

## 🏗️ Built by

**John Ayomide Akinola**  
Managing Director, Swelerion Global Ltd  
Instructor, Bloomy Technologies  
[GitHub](https://github.com/Johnprexy) · [LinkedIn](https://linkedin.com/in/john-ayomide-akinola)
