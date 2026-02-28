'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

export default function OwnerProfilePage() {
  const { user, owner } = useAuth()
  const { openAuthModal } = useAuthModal()
  const router = useRouter()

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

        <div className="flex gap-3">
          <Link
            href="/profile/edit"
            className="flex-1 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl text-center hover:bg-orange-600 transition-colors"
          >
            編集
          </Link>
          <Link
            href="/profile/settings"
            className="flex-1 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl text-center hover:bg-gray-200 transition-colors"
          >
            設定
          </Link>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium text-right max-w-[65%] break-words">{value}</span>
    </div>
  )
}
