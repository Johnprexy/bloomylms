'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MoreVertical, UserCheck, Ban, Shield } from 'lucide-react'

interface Props {
  userId: string
  currentRole: string
  isActive: boolean
}

export default function AdminUserActions({ userId, currentRole, isActive }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function updateRole(role: string) {
    setLoading(true)
    setOpen(false)
    const supabase = createClient()
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setLoading(false)
    router.refresh()
  }

  async function toggleActive() {
    setLoading(true)
    setOpen(false)
    const supabase = createClient()
    await supabase.from('profiles').update({ is_active: !isActive }).eq('id', userId)
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
            {currentRole !== 'instructor' && (
              <button onClick={() => updateRole('instructor')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                <UserCheck className="w-4 h-4 text-purple-500" /> Make Instructor
              </button>
            )}
            {currentRole !== 'student' && (
              <button onClick={() => updateRole('student')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                <UserCheck className="w-4 h-4 text-green-500" /> Make Student
              </button>
            )}
            {currentRole !== 'admin' && (
              <button onClick={() => updateRole('admin')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                <Shield className="w-4 h-4 text-red-500" /> Make Admin
              </button>
            )}
            <div className="border-t border-gray-100">
              <button onClick={toggleActive} className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${isActive ? 'text-red-600' : 'text-green-600'}`}>
                <Ban className="w-4 h-4" />
                {isActive ? 'Suspend User' : 'Activate User'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
