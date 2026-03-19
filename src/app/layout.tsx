import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-white text-gray-900`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
