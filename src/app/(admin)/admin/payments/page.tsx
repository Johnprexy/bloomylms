import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export const metadata = { title: 'Payments — Admin' }

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      student:profiles(full_name, email),
      course:courses(title)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const totalRevenue = payments?.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0) || 0
  const pending = payments?.filter(p => p.status === 'pending').length || 0
  const failed = payments?.filter(p => p.status === 'failed').length || 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'bg-green-50 text-green-600', icon: DollarSign },
          { label: 'Successful', value: payments?.filter(p => p.status === 'success').length || 0, color: 'bg-blue-50 text-blue-600', icon: CheckCircle },
          { label: 'Pending', value: pending, color: 'bg-yellow-50 text-yellow-600', icon: Clock },
          { label: 'Failed', value: failed, color: 'bg-red-50 text-red-600', icon: XCircle },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Student</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Course</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Gateway</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payments?.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{(p.student as any)?.full_name}</p>
                    <p className="text-xs text-gray-400">{(p.student as any)?.email}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 max-w-[200px] truncate">{(p.course as any)?.title}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">{formatCurrency(p.amount, p.currency)}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium capitalize bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{p.gateway}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${
                      p.status === 'success' ? 'bg-green-50 text-green-700' :
                      p.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                      p.status === 'failed' ? 'bg-red-50 text-red-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {p.status === 'success' ? <CheckCircle className="w-3 h-3" /> : p.status === 'pending' ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                  <td className="px-5 py-3 text-xs font-mono text-gray-400 truncate max-w-[120px]">{p.gateway_ref || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
