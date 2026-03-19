'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MoreVertical, Eye, Globe, Archive, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface Props { courseId: string; currentStatus: string; slug: string }

export default function AdminCourseActions({ courseId, currentStatus, slug }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function updateStatus(status: string) {
    setLoading(true)
    setOpen(false)
    const supabase = createClient()
    await supabase.from('courses').update({ status }).eq('id', courseId)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 bg-white rounded-xl shadow-xl border border-gray-100 z-20 w-44 overflow-hidden">
            <Link
              href={`/courses/${slug}`}
              className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Eye className="w-4 h-4 text-blue-500" /> Preview
            </Link>
            {currentStatus !== 'published' && (
              <button onClick={() => updateStatus('published')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                <Globe className="w-4 h-4 text-green-500" /> Publish
              </button>
            )}
            {currentStatus === 'published' && (
              <button onClick={() => updateStatus('draft')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                <EyeOff className="w-4 h-4 text-yellow-500" /> Unpublish
              </button>
            )}
            {currentStatus !== 'archived' && (
              <button onClick={() => updateStatus('archived')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-red-600 hover:text-red-700 transition-colors">
                <Archive className="w-4 h-4" /> Archive
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
