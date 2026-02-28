'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, LogIn, PawPrint, Search, Calendar, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="h-16 px-6 lg:px-10 flex items-center justify-between gap-4">

        {/* ロゴ */}
        <Link href="/home" className="flex items-center gap-1.5 shrink-0">
          <PawPrint size={17} className="text-orange-500" />
          <span className="text-base font-bold text-gray-900 tracking-tight">ウチの子</span>
        </Link>

        {/* デスクトップ: 中央に検索バー */}
        <div className="hidden lg:flex flex-1 justify-center">
          <form onSubmit={handleSearch} className="relative w-full max-w-xl">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="お店・サービスを検索..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white transition-colors"
            />
          </form>
        </div>

        {/* デスクトップ: 右側に ウチの子 / 予約 / カート / マイページ */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Link
            href="/uchinoko"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/uchinoko' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            ウチの子
          </Link>

          <Link
            href="/reservations"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/reservations' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Calendar size={14} />
            <span>予約</span>
          </Link>

          <Link
            href="/cart"
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/cart' ? 'text-orange-500 bg-orange-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart size={14} />
            <span>カート</span>
          </Link>

          {user ? (
            <>
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

        {/* モバイル: 検索アイコンのみ（カートはボトムナビに集約） */}
        <div className="lg:hidden flex items-center">
          <Link href="/search" className="p-2 text-gray-500">
            <Search size={20} />
          </Link>
        </div>

      </div>
    </header>
  )
}
