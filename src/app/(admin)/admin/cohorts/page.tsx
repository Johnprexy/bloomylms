import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Users, Calendar, Plus, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export const metadata = { title: 'Cohorts — Admin' }

export default async function AdminCohortsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('*, course:courses(title, category:categories(icon))')
    .order('start_date', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cohorts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cohorts?.length || 0} intake batches</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Cohort
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Cohort</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Course</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Start Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Enrolled</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Capacity</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {cohorts?.map(c => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-sm text-gray-900">{c.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{(c.course as any)?.category?.icon || '📚'}</span>
                      <span className="text-sm text-gray-700 truncate max-w-[200px]">{(c.course as any)?.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {format(new Date(c.start_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-gray-700">{c.enrolled_count}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                        <div
                          className="h-1.5 bg-bloomy-500 rounded-full"
                          style={{ width: `${Math.min(100, (c.enrolled_count / c.max_students) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{c.enrolled_count}/{c.max_students}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${c.is_open ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {c.is_open ? <><CheckCircle className="w-3 h-3" /> Open</> : <><XCircle className="w-3 h-3" /> Closed</>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!cohorts || cohorts.length === 0) && (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No cohorts yet</p>
            <p className="text-sm text-gray-400 mt-1">Create cohorts for each course intake</p>
          </div>
        )}
      </div>
    </div>
  )
}
