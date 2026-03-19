'use client'

import { Bell, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getInitials } from '@/lib/utils'

export default function TopBar({ profile }: { profile: any }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => d.data && setNotifications(d.data))
      .catch(() => {})
  }, [])

  const unread = notifications.filter(n => !n.read).length

  async function markRead(id: string) {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search courses..." className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bloomy-500 focus:border-transparent" />
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button onClick={() => setShowNotifs(!showNotifs)} className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-4 h-4 text-gray-600" />
            {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{unread > 9 ? '9+' : unread}</span>}
          </button>
          {showNotifs && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
              <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-sm text-gray-900">Notifications</p>
                  {unread > 0 && <span className="text-xs text-bloomy-600">{unread} unread</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0
                    ? <div className="p-6 text-center text-sm text-gray-400">No notifications yet</div>
                    : notifications.map(n => (
                        <button key={n.id} onClick={() => markRead(n.id)}
                          className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-50 ${!n.read ? 'bg-bloomy-50/50' : ''}`}>
                          <p className="text-sm font-medium text-gray-900 mb-0.5">{n.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                        </button>
                      ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">
          {getInitials(profile?.full_name || 'U')}
        </div>
      </div>
    </header>
  )
}
