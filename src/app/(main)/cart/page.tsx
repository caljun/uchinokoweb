'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function CartPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-5 pt-5 lg:pt-6 pb-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-800">カート 🛒</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-5 gap-5">
          <span className="text-6xl">🛒</span>
          <p className="text-gray-500 text-center">ログインするとカートを使えます</p>
          <Link href="/auth" className="w-full max-w-xs">
            <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold">
              ログイン / 新規登録
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // TODO: カート機能実装
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-5 pt-5 lg:pt-6 pb-5 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-800">カート 🛒</h1>
      </div>
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-5xl">🛒</span>
        <p className="text-gray-400 text-sm">カートは空です</p>
        <Link href="/search">
          <button className="mt-2 px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm">
            お店を探す
          </button>
        </Link>
      </div>
    </div>
  )
}
