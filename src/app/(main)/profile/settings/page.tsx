'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfileSettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/home')
  }

  const handleDeleteAccount = () => {
    // TODO: アカウント削除ロジック（Firebase Auth / ownersドキュメント削除など）
    alert('アカウント削除は現在準備中です。')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <p className="text-sm text-gray-500 mb-4">ログインすると設定を変更できます。</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 lg:px-10 py-6">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-lg font-bold text-gray-900">設定</h1>

        <div className="bg-white rounded-xl overflow-hidden">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-5 py-4 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium border-b border-gray-50"
          >
            ログアウト
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center gap-3 px-5 py-4 text-gray-500 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            アカウント削除
          </button>
        </div>
      </div>
    </div>
  )
}

