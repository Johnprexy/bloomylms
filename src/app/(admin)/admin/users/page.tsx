import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Users, GraduationCap, UserCheck, Shield, Search } from 'lucide-react'
import { format } from 'date-fns'
import AdminUserActions from '@/components/admin/AdminUserActions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'User Management — Admin' }

export default async function AdminUsersPage({ searchParams }: { searchParams: { role?: string; search?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  const search = searchParams.search || ''
  let users: any[]

  if (searchParams.role && search) {
    users = await sql`
      SELECT u.*,
        (SELECT string_agg(c.title, ', ' ORDER BY e.enrolled_at) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.student_id = u.id LIMIT 3) as enrolled_courses,
        (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id) as course_count
      FROM users u
      WHERE u.role = ${searchParams.role}::user_role
        AND (u.full_name ILIKE ${'%'+search+'%'} OR u.email ILIKE ${'%'+search+'%'})
      ORDER BY u.created_at DESC
    `
  } else if (searchParams.role) {
    users = await sql`
      SELECT u.*,
        (SELECT string_agg(c.title, ', ' ORDER BY e.enrolled_at) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.student_id = u.id LIMIT 3) as enrolled_courses,
        (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id) as course_count
      FROM users u WHERE u.role = ${searchParams.role}::user_role ORDER BY u.created_at DESC
    `
  } else if (search) {
    users = await sql`
      SELECT u.*,
        (SELECT string_agg(c.title, ', ' ORDER BY e.enrolled_at) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.student_id = u.id LIMIT 3) as enrolled_courses,
        (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id) as course_count
      FROM users u
      WHERE u.full_name ILIKE ${'%'+search+'%'} OR u.email ILIKE ${'%'+search+'%'}
      ORDER BY u.created_at DESC
    `
  } else {
    users = await sql`
      SELECT u.*,
        (SELECT string_agg(c.title, ', ' ORDER BY e.enrolled_at) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.student_id = u.id LIMIT 3) as enrolled_courses,
        (SELECT COUNT(*) FROM enrollments WHERE student_id = u.id) as course_count
      FROM users u ORDER BY u.created_at DESC
    `
  }

  const all = users.length
  const byRole = (r: string) => users.filter((u: any) => u.role === r).length

  const roleBadge = (role: string) => {
    if (role === 'super_admin') return 'bg-red-50 text-red-700 border border-red-100'
    if (role === 'admin') return 'bg-purple-50 text-purple-700 border border-purple-100'
    if (role === 'instructor') return 'bg-blue-50 text-blue-700 border border-blue-100'
    return 'bg-green-50 text-green-700 border border-green-100'
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{all} total users</p>
        </div>
        {/* Search */}
        <form className="relative flex-1 max-w-sm min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input name="search" defaultValue={search} placeholder="Search name or email..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloomy-500" />
        </form>
      </div>

      {/* Role filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['', 'All', all, Users],
          ['student', 'Students', byRole('student'), GraduationCap],
          ['instructor', 'Instructors', byRole('instructor'), UserCheck],
          ['admin', 'Admins', byRole('admin') + byRole('super_admin'), Shield],
        ].map(([key, label, count, Icon]: any) => (
          <a key={key} href={key ? `/admin/users?role=${key}${search ? `&search=${search}` : ''}` : '/admin/users'}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${(searchParams.role || '') === key ? 'bg-bloomy-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${(searchParams.role || '') === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">User</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Enrolled Courses</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Joined</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{u.full_name || '—'}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${roleBadge(u.role)}`}>
                      {u.role === 'super_admin' ? 'Super Admin' : u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.enrolled_courses ? (
                      <p className="text-xs text-gray-600 max-w-[220px] truncate" title={u.enrolled_courses}>
                        {u.enrolled_courses}
                        {Number(u.course_count) > 3 && <span className="text-gray-400"> +{Number(u.course_count) - 3} more</span>}
                      </p>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(u.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <AdminUserActions userId={u.id} currentRole={u.role} isActive={u.is_active} userName={u.full_name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
