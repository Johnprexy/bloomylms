'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Eye, Globe, EyeOff, Pencil, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Props {
  courseId: string
  courseTitle: string
  currentStatus: string
  slug: string
}

export default function AdminCourseActions({ courseId, courseTitle, currentStatus, slug }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()

  async function updateStatus(status: string) {
    setLoading(true); setOpen(false)
    await fetch('/api/admin/courses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: courseId, status }),
    })
    setLoading(false); router.refresh()
  }

  async function deleteCourse() {
    await fetch(`/api/admin/courses?id=${courseId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <>
      <div className="relative flex justify-end">
        <button
          onClick={() => setOpen(!open)}
          disabled={loading}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-9 bg-white rounded-xl shadow-xl border border-gray-100 z-20 w-48 overflow-hidden">
              {/* View */}
              <Link href={`/learn/${slug}`} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700">
                <Eye className="w-4 h-4 text-blue-500" /> Preview Course
              </Link>
              {/* Edit */}
              <Link href={`/admin/course-builder?edit=${courseId}`} onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700">
                <Pencil className="w-4 h-4 text-gray-500" /> Edit Course
              </Link>
              {/* Publish / Unpublish */}
              <div className="border-t border-gray-100">
                {currentStatus !== 'published'
                  ? <button onClick={() => updateStatus('published')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-green-600">
                      <Globe className="w-4 h-4" /> Publish
                    </button>
                  : <button onClick={() => updateStatus('draft')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-orange-600">
                      <EyeOff className="w-4 h-4" /> Unpublish
                    </button>
                }
              </div>
              {/* Delete */}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => { setOpen(false); setShowDeleteConfirm(true) }}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" /> Delete Course
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Course"
          message={`This will permanently delete "${courseTitle}" including all modules, lessons, enrollments, quiz attempts and grades. This cannot be undone.`}
          confirmLabel="Delete Course"
          confirmText={courseTitle.split(' ').slice(0, 2).join(' ')}
          confirmPlaceholder={`Type the first two words of the course title`}
          destructive
          onConfirm={deleteCourse}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
