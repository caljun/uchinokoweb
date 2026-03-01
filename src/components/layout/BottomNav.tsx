'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingCart, Calendar, User, PawPrint } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/home', label: 'ホーム', Icon: Home },
  { href: '/profile', label: 'マイページ', Icon: User },
  { href: '/cart', label: 'カート', Icon: ShoppingCart },
  { href: '/reservations', label: '予約', Icon: Calendar },
  { href: '/uchinoko', label: 'ウチの子', Icon: PawPrint },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center z-50"
      style={{
        height: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 transition-colors ${
              active ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
