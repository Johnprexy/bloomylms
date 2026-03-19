'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, UserCheck, Ban, Shield } from 'lucide-react'

export default function AdminUserActions({ userId, currentRole, isActive }: { userId: string; currentRole: string; isActive: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function updateRole(role: string) {
    setLoading(true); setOpen(false)
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, role }) })
    setLoading(false); router.refresh()
  }

  async function toggleActive() {
    setLoading(true); setOpen(false)
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, is_active: !isActive }) })
    setLoading(false); router.refresh()
  }

  return (
    <div className="relative flex justify-end">
      <button onClick={() => setOpen(!open)} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"><MoreVertical className="w-4 h-4" /></button>
      {open && (<>
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
        <div className="absolute right-0 top-9 bg-white rounded-xl shadow-xl border border-gray-100 z-20 w-44 overflow-hidden">
          {currentRole !== 'instructor' && <button onClick={() => updateRole('instructor')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"><UserCheck className="w-4 h-4 text-purple-500" /> Make Instructor</button>}
          {currentRole !== 'student' && <button onClick={() => updateRole('student')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"><UserCheck className="w-4 h-4 text-green-500" /> Make Student</button>}
          {currentRole !== 'admin' && <button onClick={() => updateRole('admin')} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"><Shield className="w-4 h-4 text-red-500" /> Make Admin</button>}
          <div className="border-t border-gray-100"><button onClick={toggleActive} className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${isActive ? 'text-red-600' : 'text-green-600'}`}><Ban className="w-4 h-4" />{isActive ? 'Suspend' : 'Activate'}</button></div>
        </div>
      </>)}
    </div>
  )
}
