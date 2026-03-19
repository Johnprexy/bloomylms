import { create } from 'zustand'
import type { Notification } from '@/types'

interface AppStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Notification) => void
}

export const useAppStore = create<AppStore>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
  }),

  markAsRead: (id) => set(state => {
    const notifications = state.notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    )
    return { notifications, unreadCount: notifications.filter(n => !n.read).length }
  }),

  markAllAsRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),

  addNotification: (notification) => set(state => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + (notification.read ? 0 : 1),
  })),
}))
