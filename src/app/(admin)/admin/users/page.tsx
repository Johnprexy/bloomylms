import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, Search, Shield, UserCheck, GraduationCap } from 'lucide-react'
import { format } from 'date-fns'
import AdminUserActions from '@/components/admin/AdminUserActions'

export const metadata = { title: 'User Management — Admin' }

export default async function AdminUsersPage({ searchParams }: { searchParams: { role?: string; search?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (searchParams.role) query = query.eq('role', searchParams.role)
  if (searchParams.search) query = query.ilike('full_name', `%${searchParams.search}%`)

  const { data: users, count } = await query

  const roleCounts = {
    all: users?.length || 0,
    student: users?.filter(u => u.role === 'student').length || 0,
    instructor: users?.filter(u => u.role === 'instructor').length || 0,
    admin: users?.filter(u => u.role === 'admin').length || 0,
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users?.length || 0} total users</p>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '', label: 'All', count: roleCounts.all, icon: Users },
          { key: 'student', label: 'Students', count: roleCounts.student, icon: GraduationCap },
          { key: 'instructor', label: 'Instructors', count: roleCounts.instructor, icon: UserCheck },
          { key: 'admin', label: 'Admins', count: roleCounts.admin, icon: Shield },
        ].map(tab => (
          <a
            key={tab.key}
            href={tab.key ? `/admin/users?role=${tab.key}` : '/admin/users'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              (searchParams.role || '') === tab.key
                ? 'bg-bloomy-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              (searchParams.role || '') === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <form method="GET">
            {searchParams.role && <input type="hidden" name="role" value={searchParams.role} />}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="search" defaultValue={searchParams.search} placeholder="Search by name or email..." className="input-field pl-10 text-sm" />
            </div>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Location</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Joined</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{u.full_name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      u.role === 'admin' ? 'bg-red-50 text-red-700' :
                      u.role === 'instructor' ? 'bg-purple-50 text-purple-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{u.location || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {format(new Date(u.created_at), 'MMM d, yyyy')}
                  </td>
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
      </div>
    </div>
  )
}
