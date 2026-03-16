'use client'

import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <h1 className="text-xl font-bold text-gray-900">通知</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-24 px-6 gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <Bell size={28} className="text-gray-300" strokeWidth={1.5} />
        </div>
        <p className="text-gray-400 text-sm text-center">通知はまだありません</p>
      </div>
    </div>
  )
}
