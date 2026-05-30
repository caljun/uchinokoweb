'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Camera, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function BottomNav() {
  const pathname = usePathname()
  const { owner } = useAuth()

  const isHome = pathname === '/home' || pathname === '/'
  const isProfile = pathname.startsWith('/profile') || pathname.startsWith('/uchinoko')

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center z-50"
      style={{
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* ホーム */}
      <Link
        href="/home"
        className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1 transition-colors ${isHome ? 'text-orange-500' : 'text-gray-400'}`}
      >
        <Home size={22} />
        <span className="text-[10px] font-medium">ホーム</span>
      </Link>

      {/* カメラ（中央） */}
      <div className="flex-1 flex flex-col items-center justify-center pb-1">
        <Link
          href="/post"
          className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <Camera size={22} className="text-white" />
        </Link>
      </div>

      {/* プロフ */}
      <Link
        href="/profile"
        className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1 transition-colors ${isProfile ? 'text-orange-500' : 'text-gray-400'}`}
      >
        {owner?.photoUrl ? (
          <div className={`w-6 h-6 rounded-full overflow-hidden ring-2 ${isProfile ? 'ring-orange-500' : 'ring-transparent'}`}>
            <Image src={owner.photoUrl} alt="" width={24} height={24} className="object-cover w-full h-full" />
          </div>
        ) : (
          <User size={22} />
        )}
        <span className="text-[10px] font-medium">プロフ</span>
      </Link>
    </nav>
  )
}
