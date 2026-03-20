'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackButton({ fallback = '/dashboard', label = 'Back' }: { fallback?: string; label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}
