'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { PawPrint, Calendar, Package, Heart, ChevronRight } from 'lucide-react'

export default function ProfilePage() {
  const { user, owner, signOut } = useAuth()
  const { openAuthModal } = useAuthModal()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/home')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center py-20 px-5 gap-5">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-3xl text-gray-300">👤</span>
          </div>
          <p className="text-gray-500 text-center text-sm">ログインするとうちの子の登録や予約ができます</p>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full max-w-xs py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
          >
            ログイン / 新規登録
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 lg:px-10 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-6 lg:space-y-0">

          {/* 左: プロフィールカード */}
          <div className="lg:col-span-1 space-y-4">
            <h1 className="text-lg font-bold text-gray-900">プロフィール</h1>
            <div className="bg-white rounded-xl p-6 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-2xl font-bold text-orange-500">
                {owner?.displayName?.[0] ?? 'U'}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">{owner?.displayName ?? 'オーナー'}</p>
                <p className="text-gray-400 text-sm mt-0.5">{owner?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>

          {/* 右: メニュー */}
          <div className="lg:col-span-2 space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">アカウント</h2>
              <div className="bg-white rounded-xl overflow-hidden">
                <MenuItem label="飼い主プロフィール" Icon={PawPrint} href="/profile/owner" />
                <MenuItem label="お気に入り" Icon={Heart} href="/profile/favorites" />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">履歴</h2>
              <div className="bg-white rounded-xl overflow-hidden">
                <MenuItem label="予約履歴" Icon={Calendar} href="/reservations" />
                <MenuItem label="注文履歴" Icon={Package} href="/orders" />
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}

function MenuItem({
  label,
  Icon,
  href,
}: {
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
    >
      <Icon size={18} className="text-gray-500" />
      <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
      <ChevronRight size={16} className="text-gray-300" />
    </Link>
  )
}
