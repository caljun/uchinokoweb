'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, BookOpen, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { owner } = useAuth()

  const tabs = [
    { href: '/mentor', icon: <Home size={22} />, label: 'ホーム', match: (p: string) => p === '/mentor' || p === '/home' || p.startsWith('/mentor/behaviors') },
    { href: '/mentor/checkin', icon: <CheckSquare size={22} />, label: 'チェックイン', match: (p: string) => p.startsWith('/mentor/checkin') },
    { href: '/mentor/missions', icon: <BookOpen size={22} />, label: 'ミッション', match: (p: string) => p.startsWith('/mentor/missions') },
    {
      href: '/profile',
      icon: owner?.photoUrl ? (
        <div className="w-6 h-6 rounded-full overflow-hidden">
          <Image src={owner.photoUrl} alt="" width={24} height={24} className="object-cover w-full h-full" />
        </div>
      ) : <User size={22} />,
      label: 'マイページ',
      match: (p: string) => p.startsWith('/profile') || p.startsWith('/uchinoko'),
    },
  ]

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center z-50"
      style={{
        height: 'calc(72px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center gap-0.5 pb-2 pt-2 transition-colors ${
              active ? 'text-orange-500' : 'text-gray-400'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
