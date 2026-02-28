'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/home', label: 'ホーム', icon: '🏠' },
  { href: '/search', label: 'お店を探す', icon: '🔍' },
  { href: '/cart', label: 'カート', icon: '🛒' },
  { href: '/reservations', label: '予約', icon: '📅' },
  { href: '/profile', label: 'マイページ', icon: '👤' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 z-40">
      <div className="px-6 py-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-orange-500">うちの子 🐾</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                active
                  ? 'bg-orange-50 text-orange-500 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
