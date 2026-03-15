'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace('/profile')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {/* ヒーロー */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-20 pb-10">
        <div className="text-6xl mb-4">🐾</div>
        <h1 className="text-3xl font-bold text-orange-500 mb-2">ウチの子</h1>
        <p className="text-gray-500 text-base leading-relaxed max-w-xs">
          ウチの子のプロフィールを作って、<br />
          毎日のミッションで1位を目指そう。
        </p>

        <div className="mt-10 w-full max-w-sm space-y-3">
          <div className="flex items-start gap-3 text-left bg-white rounded-2xl p-4 shadow-sm">
            <span className="text-2xl">📸</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">写真ミッション</p>
              <p className="text-xs text-gray-400">毎日こなしてポイントを貯める</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-left bg-white rounded-2xl p-4 shadow-sm">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">週間ランキング</p>
              <p className="text-xs text-gray-400">愛犬を1位へ！</p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-left bg-white rounded-2xl p-4 shadow-sm">
            <span className="text-2xl">🛍️</span>
            <div>
              <p className="font-bold text-gray-800 text-sm">ウチの子おすすめ</p>
              <p className="text-xs text-gray-400">愛犬に合った商品をピックアップ！</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-12 space-y-3 max-w-sm mx-auto w-full">
        <button
          onClick={() => router.push('/auth?mode=signup')}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors"
        >
          はじめる（無料）
        </button>
        <button
          onClick={() => router.push('/auth')}
          className="w-full py-3 text-orange-500 text-sm font-medium"
        >
          ログインはこちら
        </button>
      </div>
    </div>
  )
}
