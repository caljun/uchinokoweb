'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Target, Trophy, Home, PawPrint, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { href: '/uchinoko', label: 'ウチの子', Icon: PawPrint },
  { href: '/missions', label: 'ミッション', Icon: Target },
  { href: '/ranking', label: 'ランキング', Icon: Trophy },
  { href: '/home', label: 'おすすめ', Icon: Home },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { owner } = useAuth()
  const profileActive = pathname.startsWith('/profile')

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center z-50"
      style={{
        height: 'calc(80px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 pb-2 transition-colors ${
              active ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        )
      })}
      <Link
        href="/profile"
        className={`flex-1 flex flex-col items-center gap-1 pb-2 transition-colors ${
          profileActive ? 'text-orange-500' : 'text-gray-400'
        }`}
      >
        <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold ${owner?.photoUrl ? '' : profileActive ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
          {owner?.photoUrl ? (
            <Image src={owner.photoUrl} alt="" width={24} height={24} className="object-cover w-full h-full" />
          ) : (
            <User size={14} />
          )}
        </div>
        <span className="text-xs font-medium">マイページ</span>
      </Link>
    </nav>
  )
}
