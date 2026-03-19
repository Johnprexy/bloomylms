import { redirect } from 'next/navigation'

import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'

import { sql } from '@/lib/db'

import { DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'

import { formatCurrency } from '@/lib/utils'

import { format } from 'date-fns'

export const dynamic = 'force-dynamic'


export const metadata = { title: 'Payments — Admin' }

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')
  const payments = await sql`SELECT p.*, u.full_name, u.email, c.title as course_title FROM payments p LEFT JOIN users u ON p.student_id = u.id LEFT JOIN courses c ON p.course_id = c.id ORDER BY p.created_at DESC LIMIT 100`
  const totalRevenue = payments.filter((p: any) => p.status === 'success').reduce((s: number, p: any) => s + Number(p.amount), 0)
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), color: 'bg-green-50 text-green-600', icon: DollarSign },
          { label: 'Successful', value: payments.filter((p: any) => p.status === 'success').length, color: 'bg-blue-50 text-blue-600', icon: CheckCircle },
          { label: 'Pending', value: payments.filter((p: any) => p.status === 'pending').length, color: 'bg-yellow-50 text-yellow-600', icon: Clock },
          { label: 'Failed', value: payments.filter((p: any) => p.status === 'failed').length, color: 'bg-red-50 text-red-600', icon: XCircle },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2`}><s.icon className="w-4 h-4" /></div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              {['Student','Course','Amount','Gateway','Status','Date'].map(h => <th key={h} className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {payments.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3"><p className="text-sm font-medium text-gray-900">{p.full_name}</p><p className="text-xs text-gray-400">{p.email}</p></td>
                  <td className="px-5 py-3 text-sm text-gray-700 max-w-[200px] truncate">{p.course_title}</td>
                  <td className="px-5 py-3 text-sm font-semibold">{formatCurrency(Number(p.amount), p.currency)}</td>
                  <td className="px-5 py-3"><span className="text-xs font-medium capitalize bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{p.gateway}</span></td>
                  <td className="px-5 py-3"><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.status === 'success' ? 'bg-green-50 text-green-700' : p.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>{p.status}</span></td>
                  <td className="px-5 py-3 text-sm text-gray-500">{format(new Date(p.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
