'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn, PawPrint, Target, Trophy, Home, Bell } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

const NAV_ITEMS = [
  { href: '/profile', label: 'マイページ', Icon: PawPrint },
  { href: '/missions', label: 'ミッション', Icon: Target },
  { href: '/ranking', label: 'ランキング', Icon: Trophy },
  { href: '/home', label: 'おすすめ', Icon: Home },
]

export default function Header() {
  const pathname = usePathname()
  const { user, owner } = useAuth()
  const { openAuthModal } = useAuthModal()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="h-16 px-6 lg:px-10 flex items-center justify-between gap-4">

        {/* ロゴ */}
        <Link href="/home" className="flex items-center gap-1.5 shrink-0">
          <PawPrint size={17} className="text-orange-500" />
          <span className="text-base font-bold text-gray-900 tracking-tight">ウチの子</span>
        </Link>

        {/* デスクトップ: 中央ナビ */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'text-orange-500 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>

        {/* 右側: 通知 / ログイン */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {owner && (
                <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-full">
                  {owner.totalPoints}pt
                </span>
              )}
              <Link href="/notifications">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ring-2 ${pathname === '/notifications' ? 'ring-orange-500 bg-orange-50' : 'ring-transparent hover:bg-gray-100'}`}>
                  <Bell size={18} className={pathname === '/notifications' ? 'text-orange-500' : 'text-gray-500'} />
                </div>
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
            >
              <LogIn size={14} />
              ログイン
            </button>
          )}
        </div>

        {/* モバイル: 通知アイコン */}
        {user ? (
          <Link href="/notifications" className="lg:hidden">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ring-2 ${pathname === '/notifications' ? 'ring-orange-500 bg-orange-50' : 'ring-transparent'}`}>
              <Bell size={18} className={pathname === '/notifications' ? 'text-orange-500' : 'text-gray-500'} />
            </div>
          </Link>
        ) : (
          <button type="button" onClick={openAuthModal} className="lg:hidden">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <LogIn size={16} className="text-gray-400" />
            </div>
          </button>
        )}

      </div>
    </header>
  )
}
