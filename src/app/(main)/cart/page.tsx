'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function CartPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center py-20 px-5 gap-5">
          <ShoppingCart size={48} strokeWidth={1.5} className="text-gray-300" />
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
      <div className="max-w-2xl mx-auto px-6 py-20">
      <div className="flex flex-col items-center justify-center gap-3">
        <ShoppingCart size={48} strokeWidth={1.5} className="text-gray-300" />
        <p className="text-gray-400 text-sm">カートは空です</p>
        <Link href="/search">
          <button className="mt-2 px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm">
            お店を探す
          </button>
        </Link>
      </div>
      </div>
    </div>
  )
}
