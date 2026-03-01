'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password, displayName)
      }
      router.replace('/home')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '認証に失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-orange-50 to-white">
      {/* ロゴ */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-2">🐾</div>
        <h1 className="text-3xl font-bold text-orange-500">ウチの子</h1>
        <p className="text-gray-500 mt-1 text-sm">わんちゃんと飼い主さんをつなぐ</p>
      </div>

      {/* タブ切り替え */}
      <div className="w-full max-w-sm bg-gray-100 rounded-xl p-1 flex mb-6">
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            isLogin ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
          }`}
          onClick={() => setIsLogin(true)}
        >
          ログイン
        </button>
        <button
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            !isLogin ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
          }`}
          onClick={() => setIsLogin(false)}
        >
          新規登録
        </button>
      </div>

      {/* フォーム */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="山田 太郎"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-orange-600 transition-colors"
        >
          {loading ? '処理中...' : isLogin ? 'ログイン' : '登録する'}
        </button>
      </form>
    </div>
  )
}
