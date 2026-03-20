import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { isAdmin } from '@/lib/permissions'
import { Users, GraduationCap, UserCheck, Shield, UserPlus } from 'lucide-react'
import { format } from 'date-fns'
import AdminUserActions from '@/components/admin/AdminUserActions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'User Management — Admin' }

export default async function AdminUsersPage({ searchParams }: { searchParams: { role?: string; q?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  if (!isAdmin((session.user as any).role)) redirect('/dashboard')

  let users
  const q = searchParams.q
  if (q) {
    users = await sql`SELECT * FROM users WHERE full_name ILIKE ${'%' + q + '%'} OR email ILIKE ${'%' + q + '%'} ORDER BY created_at DESC`
  } else if (searchParams.role) {
    users = await sql`SELECT * FROM users WHERE role = ${searchParams.role}::user_role ORDER BY created_at DESC`
  } else {
    users = await sql`SELECT * FROM users ORDER BY created_at DESC`
  }

  const all = await sql`SELECT COUNT(*) as n FROM users`
  const byRole = await sql`SELECT role, COUNT(*) as n FROM users GROUP BY role`
  const counts: any = { all: Number(all[0].n) }
  byRole.forEach((r: any) => { counts[r.role] = Number(r.n) })

  const currentUserRole = (session.user as any).role

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">{counts.all} total users</p>
        </div>
        <Link href="/admin/users/new" className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Create User
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-3">
        <input name="q" defaultValue={q} placeholder="Search by name or email..." className="input-field flex-1 max-w-sm" />
        <button type="submit" className="btn-secondary text-sm px-4">Search</button>
        {q && <Link href="/admin/users" className="btn-secondary text-sm px-4">Clear</Link>}
      </form>

      {/* Role filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['', 'All', counts.all, Users],
          ['student', 'Students', counts.student || 0, GraduationCap],
          ['instructor', 'Instructors', counts.instructor || 0, UserCheck],
          ['admin', 'Admins', counts.admin || 0, Shield],
          ['super_admin', 'Super Admins', counts.super_admin || 0, Shield],
        ].map(([key, label, count, Icon]: any) => (
          <Link key={String(key)} href={key ? `/admin/users?role=${key}` : '/admin/users'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(searchParams.role || '') === key ? 'bg-bloomy-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <Icon className="w-3.5 h-3.5" />{label as string}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${(searchParams.role || '') === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count as number}</span>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['User', 'Role', 'Phone', 'Location', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`text-${h === 'Actions' ? 'right' : 'left'} text-xs font-semibold text-gray-500 px-5 py-3`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{u.full_name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      u.role === 'super_admin' ? 'bg-purple-50 text-purple-700' :
                      u.role === 'admin' ? 'bg-red-50 text-red-700' :
                      u.role === 'instructor' ? 'bg-blue-50 text-blue-700' :
                      'bg-green-50 text-green-700'}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{u.phone || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{u.location || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <AdminUserActions userId={u.id} currentRole={u.role} isActive={u.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No users found</div>}
      </div>
    </div>
  )
}
