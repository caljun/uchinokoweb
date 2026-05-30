'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogIn, Bell, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

export default function Header() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="h-14 px-4 flex items-center relative">

        {/* 左スペーサー（右アイコン分と対称） */}
        <div className="flex items-center gap-1 opacity-0 pointer-events-none">
          <div className="w-9 h-9" />
          <div className="w-9 h-9" />
        </div>

        {/* 中央ロゴ */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Link href="/home" className="text-lg font-black tracking-tight text-gray-900 pointer-events-auto">
            uchinoko<span className="text-orange-500">.</span>
          </Link>
        </div>

        {/* 右アイコン群 */}
        <div className="ml-auto flex items-center gap-1">
          <Link href="/search">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${pathname.startsWith('/search') ? 'bg-orange-50 text-orange-500' : 'text-gray-500 hover:bg-gray-100'}`}>
              <Search size={18} />
            </div>
          </Link>
          {user ? (
            <Link href="/notifications">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${pathname === '/notifications' ? 'bg-orange-50 text-orange-500' : 'text-gray-500 hover:bg-gray-100'}`}>
                <Bell size={18} />
              </div>
            </Link>
          ) : (
            <button type="button" onClick={openAuthModal}>
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <LogIn size={16} className="text-gray-400" />
              </div>
            </button>
          )}
        </div>

      </div>
    </header>
  )
}
