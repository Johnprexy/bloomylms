import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { Users, GraduationCap, UserCheck, Shield } from 'lucide-react'

import { format } from 'date-fns'

import AdminUserActions from '@/components/admin/AdminUserActions'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'User Management — Admin' }

export default async function AdminUsersPage({ searchParams }: { searchParams: { role?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  let users
  if (searchParams.role) {
    users = await sql`SELECT * FROM users WHERE role = ${searchParams.role}::user_role ORDER BY created_at DESC`
  } else {
    users = await sql`SELECT * FROM users ORDER BY created_at DESC`
  }

  const all = users.length
  const byRole = (r: string) => users.filter((u: any) => u.role === r).length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">User Management</h1><p className="text-sm text-gray-500">{all} total users</p></div>
      <div className="flex gap-2 flex-wrap">
        {[['', 'All', all, Users], ['student', 'Students', byRole('student'), GraduationCap], ['instructor', 'Instructors', byRole('instructor'), UserCheck], ['admin', 'Admins', byRole('admin'), Shield]].map(([key, label, count, Icon]: any) => (
          <a key={key} href={key ? `/admin/users?role=${key}` : '/admin/users'} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(searchParams.role || '') === key ? 'bg-bloomy-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${(searchParams.role || '') === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
          </a>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">User</th>
            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Role</th>
            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Location</th>
            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Joined</th>
            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
            <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">{u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div><div><p className="font-medium text-sm text-gray-900">{u.full_name}</p><p className="text-xs text-gray-400">{u.email}</p></div></div></td>
                <td className="px-5 py-4"><span className={`text-xs font-medium px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-red-50 text-red-700' : u.role === 'instructor' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>{u.role}</span></td>
                <td className="px-5 py-4 text-sm text-gray-500">{u.location || '—'}</td>
                <td className="px-5 py-4 text-sm text-gray-500">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                <td className="px-5 py-4"><span className={`text-xs font-medium px-2 py-1 rounded-full ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></td>
                <td className="px-5 py-4"><AdminUserActions userId={u.id} currentRole={u.role} isActive={u.is_active} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
