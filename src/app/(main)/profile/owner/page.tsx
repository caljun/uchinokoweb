'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

export default function OwnerProfilePage() {
  const { user, owner, signOut } = useAuth()
  const { openAuthModal } = useAuthModal()
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)

  if (!user || !owner) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <p className="text-sm text-gray-500 mb-4">ログインすると飼い主プロフィールを確認できます。</p>
        <button
          type="button"
          onClick={openAuthModal}
          className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          ログイン / 新規登録
        </button>
      </div>
    )
  }

  const displayName = owner.name ?? owner.displayName ?? '未設定'

  const addressParts = [
    owner.postalCode ? `〒${owner.postalCode}` : '',
    owner.prefecture ?? '',
    owner.city ?? '',
    owner.street ?? '',
    owner.building ?? '',
  ].filter(Boolean)
  const addressLabel =
    addressParts.length > 0 ? addressParts.join(' ') : owner.address ?? '未設定'

  return (
    <div className="min-h-screen bg-gray-50 px-6 lg:px-10 py-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">飼い主プロフィール</h1>
        </div>

        <div className="bg-white rounded-xl p-5 space-y-3">
          <FieldRow label="名前" value={displayName} />
          {owner.nameKana && <FieldRow label="ふりがな" value={owner.nameKana} />}
          <FieldRow label="性別" value={owner.gender ?? '未設定'} />
          <FieldRow label="生年月日" value={owner.birthday ?? owner.birthDate ?? '未設定'} />
          <FieldRow label="電話番号" value={owner.phone ?? '未設定'} />
          <FieldRow label="住所" value={addressLabel} />
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="w-full py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl text-center hover:bg-gray-200 transition-colors"
        >
          設定
        </button>
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSignOut={async () => {
            await signOut()
            router.replace('/home')
          }}
        />
      )}
    </div>
  )
}

// ---- Settings Modal ----

function SettingsModal({
  onClose,
  onSignOut,
}: {
  onClose: () => void
  onSignOut: () => Promise<void>
}) {
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    await onSignOut()
  }

  const handleDeleteAccount = () => {
    alert('アカウント削除は現在準備中です。')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">設定</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-1">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full text-left px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {signingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full text-left px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            アカウント削除
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Shared helpers ----

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium text-right max-w-[65%] break-words">{value}</span>
    </div>
  )
}
