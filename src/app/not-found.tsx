import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bloomy-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <span className="text-white text-4xl font-bold">?</span>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Page not found</h2>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Home
          </Link>
          <Link href="/courses" className="btn-secondary">Browse Courses</Link>
          <Link href="/dashboard" className="btn-secondary">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
