'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn, PawPrint, User, Target, Trophy, Home } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

const NAV_ITEMS = [
  { href: '/uchinoko', label: 'ウチの子', Icon: PawPrint },
  { href: '/missions', label: 'ミッション', Icon: Target },
  { href: '/ranking', label: 'ランキング', Icon: Trophy },
  { href: '/home', label: 'おすすめ', Icon: Home },
]

export default function Header() {
  const pathname = usePathname()
  const { user, signOut, owner } = useAuth()
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

        {/* 右側: マイページ / ログイン */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              {owner && (
                <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-full">
                  {owner.totalPoints}pt
                </span>
              )}
              <Link
                href="/profile"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/profile' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <User size={14} />
                <span>マイページ</span>
              </Link>
              <button
                onClick={signOut}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ログアウト
              </button>
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

        {/* モバイル: ポイント表示 */}
        {user && owner && (
          <div className="lg:hidden">
            <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-full">
              {owner.totalPoints}pt
            </span>
          </div>
        )}

      </div>
    </header>
  )
}
