import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: { default: 'BloomyLMS — Bloomy Technologies', template: '%s | BloomyLMS' },
  description: 'Professional Learning Management System for Bloomy Technologies. Master DevOps, Cloud, Cybersecurity, Data Analysis, and Web Development.',
  keywords: ['LMS', 'DevOps', 'Cloud', 'Cybersecurity', 'Lagos', 'Tech Training'],
  openGraph: {
    title: 'BloomyLMS — Bloomy Technologies',
    description: 'Launch your tech career with world-class training',
    url: 'https://lms.bloomy360.com',
    siteName: 'BloomyLMS',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
