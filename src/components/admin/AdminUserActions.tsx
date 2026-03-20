'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MoreVertical, UserCheck, Ban, Shield, Star } from 'lucide-react'

export default function AdminUserActions({ userId, currentRole, isActive }: { userId: string; currentRole: string; isActive: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  const myRole = (session?.user as any)?.role as string
  const isSuperAdmin = myRole === 'super_admin'

  async function update(payload: object) {
    setLoading(true); setOpen(false)
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, ...payload }) })
    setLoading(false); router.refresh()
  }

  const roleOptions = [
    { value: 'student', label: 'Student', icon: UserCheck, color: 'text-green-600' },
    { value: 'instructor', label: 'Instructor', icon: UserCheck, color: 'text-purple-600' },
    ...(isSuperAdmin ? [
      { value: 'admin', label: 'Admin', icon: Shield, color: 'text-red-600' },
      { value: 'super_admin', label: 'Super Admin', icon: Star, color: 'text-orange-600' },
    ] : []),
  ].filter(r => r.value !== currentRole)

  return (
    <div className="relative flex justify-end">
      <button onClick={() => setOpen(!open)} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (<>
        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
        <div className="absolute right-0 top-9 bg-white rounded-xl shadow-xl border border-gray-100 z-20 w-48 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Change Role</p>
          </div>
          {roleOptions.map(opt => (
            <button key={opt.value} onClick={() => update({ role: opt.value })} className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${opt.color}`}>
              <opt.icon className="w-4 h-4" /> Make {opt.label}
            </button>
          ))}
          <div className="border-t border-gray-100">
            <button onClick={() => update({ is_active: !isActive })} className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${isActive ? 'text-red-600' : 'text-green-600'}`}>
              <Ban className="w-4 h-4" />{isActive ? 'Suspend Account' : 'Activate Account'}
            </button>
          </div>
        </div>
      </>)}
    </div>
  )
}
