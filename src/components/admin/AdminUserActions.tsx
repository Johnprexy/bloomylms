'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { MoreVertical, UserCheck, Ban, Shield, Star, Trash2 } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface Props {
  userId: string
  currentRole: string
  isActive: boolean
  userName?: string
}

export default function AdminUserActions({ userId, currentRole, isActive, userName }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()
  const myRole = (session?.user as any)?.role as string
  const myId = (session?.user as any)?.id as string
  const isSuperAdmin = myRole === 'super_admin'
  const isMe = userId === myId

  async function update(payload: object) {
    setLoading(true); setOpen(false)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, ...payload }),
    })
    setLoading(false); router.refresh()
  }

  async function deleteUser() {
    await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' })
    router.refresh()
  }

  const roleOptions = [
    { value: 'student', label: 'Student', icon: UserCheck, color: 'text-green-600' },
    { value: 'instructor', label: 'Instructor', icon: UserCheck, color: 'text-blue-600' },
    ...(isSuperAdmin ? [
      { value: 'admin', label: 'Admin', icon: Shield, color: 'text-purple-600' },
      { value: 'super_admin', label: 'Super Admin', icon: Star, color: 'text-orange-600' },
    ] : []),
  ].filter(r => r.value !== currentRole)

  return (
    <>
      <div className="relative flex justify-end">
        <button
          onClick={() => setOpen(!open)}
          disabled={loading || isMe}
          title={isMe ? "Can't modify your own account" : 'Actions'}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30">
          <MoreVertical className="w-4 h-4" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-9 bg-white rounded-xl shadow-xl border border-gray-100 z-20 w-52 overflow-hidden">
              {/* Role changes */}
              {roleOptions.length > 0 && (
                <>
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Change Role</p>
                  </div>
                  {roleOptions.map(opt => (
                    <button key={opt.value} onClick={() => update({ role: opt.value })}
                      className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${opt.color}`}>
                      <opt.icon className="w-4 h-4" /> Make {opt.label}
                    </button>
                  ))}
                </>
              )}
              {/* Suspend/Activate */}
              <div className="border-t border-gray-100">
                <button onClick={() => update({ is_active: !isActive })}
                  className={`flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 ${isActive ? 'text-orange-600' : 'text-green-600'}`}>
                  <Ban className="w-4 h-4" />
                  {isActive ? 'Suspend Account' : 'Activate Account'}
                </button>
              </div>
              {/* Delete */}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => { setOpen(false); setShowDeleteConfirm(true) }}
                  className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 text-red-600">
                  <Trash2 className="w-4 h-4" /> Delete User
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete User"
          message={`This will permanently delete ${userName || 'this user'} and all their data — enrollments, progress, quiz attempts and grades. This cannot be undone.`}
          confirmLabel="Delete User"
          confirmText={userName?.split(' ')[0] || 'DELETE'}
          confirmPlaceholder={`Type "${userName?.split(' ')[0] || 'DELETE'}" to confirm`}
          destructive
          onConfirm={deleteUser}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
