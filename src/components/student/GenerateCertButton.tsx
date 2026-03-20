'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function GenerateCertButton({ enrollmentId }: { enrollmentId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function generate() {
    setLoading(true)
    const res = await fetch('/api/certificates/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollmentId }),
    })
    setLoading(false)
    if (res.ok) router.refresh()
  }

  return (
    <button onClick={generate} disabled={loading}
      className="text-xs font-semibold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-1.5 rounded-lg flex-shrink-0 flex items-center gap-1.5 disabled:opacity-60">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '🏆'} Claim
    </button>
  )
}
