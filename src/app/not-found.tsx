import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bloomy-gradient rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-bloomy-200">
          <span className="text-white text-4xl font-bold">4</span>
          <span className="text-white/70 text-4xl font-bold mx-1">0</span>
          <span className="text-white text-4xl font-bold">4</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary">Go to Dashboard</Link>
          <Link href="/" className="btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
