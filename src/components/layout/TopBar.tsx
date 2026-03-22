'use client'

import { Bell, Search, Menu, X, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getInitials } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function TopBar({ profile }: { profile: any }) {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  function openSidebar() {
    window.dispatchEvent(new CustomEvent('open-sidebar'))
  }

  const name = profile?.full_name || session?.user?.name || 'User'
  const initials = getInitials(name)

  return (
    <>
      <header className="h-14 lg:h-16 bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 gap-3 flex-shrink-0 relative z-30">

        {/* Mobile menu button */}
        <button
          onClick={openSidebar}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600 flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo — mobile only */}
        <div className="lg:hidden flex items-center gap-2 flex-1">
          <div className="w-7 h-7 bloomy-gradient rounded-lg flex items-center justify-center">
            <img src="/bloomy-logo.jpg" alt="Bloomy" className="w-full h-full object-cover rounded-lg" />
          </div>
          <span className="font-bold text-gray-900 text-sm">BloomyLMS</span>
        </div>

        {/* Search — desktop */}
        <div className="hidden lg:flex relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloomy-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Search toggle — mobile */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600"
          >
            {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-4 h-4 text-gray-600" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showNotifs && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifs(false)} />
                <div className="absolute right-0 top-11 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="font-semibold text-sm text-gray-900">Notifications</p>
                    {unread > 0 && (
                      <button onClick={async () => {
                        await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mark_all: true }) })
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                      }} className="text-xs text-bloomy-600 font-medium">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0
                      ? <div className="p-8 text-center text-sm text-gray-400"><Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />No notifications yet</div>
                      : notifications.map(n => (
                          <button key={n.id} onClick={() => { markRead(n.id); setShowNotifs(false) }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors ${!n.read ? 'bg-bloomy-50/40' : ''}`}>
                            <div className="flex items-start gap-2.5">
                              {!n.read && <span className="w-2 h-2 bg-bloomy-500 rounded-full flex-shrink-0 mt-1.5" />}
                              <div className={!n.read ? '' : 'pl-4'}>
                                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 bloomy-gradient rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 cursor-pointer">
            {initials}
          </div>
        </div>
      </header>

      {/* Mobile search bar — slides down */}
      {showSearch && (
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-2.5 z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bloomy-500"
            />
          </div>
        </div>
      )}
    </>
  )
}
