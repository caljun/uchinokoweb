'use client'

import { useState } from 'react'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useAuth } from '@/contexts/AuthContext'
import { X } from 'lucide-react'

export default function AuthModal() {
  const { isOpen, closeAuthModal } = useAuthModal()
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password, displayName, referralCode.trim().toUpperCase() || undefined)
      }
      closeAuthModal()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '認証に失敗しました'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeAuthModal()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white flex justify-end p-3 rounded-t-2xl">
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-8 pt-0">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🐾</div>
            <h2 className="text-xl font-bold text-orange-500">ウチの子</h2>
            <p className="text-gray-500 text-xs mt-1">わんちゃんと飼い主さんをつなぐ</p>
          </div>

          <div className="bg-gray-100 rounded-xl p-1 flex mb-5">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isLogin ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
              }`}
              onClick={() => setIsLogin(true)}
            >
              ログイン
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isLogin ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'
              }`}
              onClick={() => setIsLogin(false)}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="山田 太郎"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm"
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm"
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">招待コード（任意）</label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm uppercase tracking-widest"
                />
                <p className="text-xs text-gray-400 mt-1">友達の招待コードを入力するとお互いに100ptもらえます</p>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-orange-600 transition-colors"
            >
              {loading ? '処理中...' : isLogin ? 'ログイン' : '登録する'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
