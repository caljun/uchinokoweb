'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, X } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'

const INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-gray-800 text-sm'

export default function OwnerProfilePage() {
  const { user, owner, reloadOwner, signOut } = useAuth()
  const { openAuthModal } = useAuthModal()
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
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

        <div className="flex gap-3">
          <button
            onClick={() => setShowEdit(true)}
            className="flex-1 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl text-center hover:bg-orange-600 transition-colors"
          >
            編集
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl text-center hover:bg-gray-200 transition-colors"
          >
            設定
          </button>
        </div>
      </div>

      {showEdit && (
        <EditModal
          owner={owner}
          userId={user.uid}
          reloadOwner={reloadOwner}
          onClose={() => setShowEdit(false)}
        />
      )}

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

// ---- Edit Modal ----

function EditModal({
  owner,
  userId,
  reloadOwner,
  onClose,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  owner: any
  userId: string
  reloadOwner: () => Promise<void>
  onClose: () => void
}) {
  const [name, setName] = useState(owner.name ?? owner.displayName ?? '')
  const [nameKana, setNameKana] = useState(owner.nameKana ?? '')
  const [gender, setGender] = useState(owner.gender ?? '')
  const [birthday, setBirthday] = useState(owner.birthday ?? owner.birthDate ?? '')
  const [phone, setPhone] = useState(owner.phone ?? '')
  const [postalCode, setPostalCode] = useState(owner.postalCode ?? '')
  const [prefecture, setPrefecture] = useState(owner.prefecture ?? '')
  const [city, setCity] = useState(owner.city ?? '')
  const [street, setStreet] = useState(owner.street ?? '')
  const [building, setBuilding] = useState(owner.building ?? '')
  const [saving, setSaving] = useState(false)
  const [searchingPostal, setSearchingPostal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const searchPostalCode = async () => {
    const code = postalCode.replace(/-/g, '')
    if (code.length !== 7) {
      setError('郵便番号は7桁で入力してください')
      return
    }
    setSearchingPostal(true)
    setError('')
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`)
      const data = await res.json()
      if (data.results?.length > 0) {
        const result = data.results[0]
        setPrefecture(result.address1)
        setCity(result.address2 + result.address3)
        setStreet('')
      } else {
        setError('住所が見つかりませんでした')
      }
    } catch {
      setError('郵便番号の検索に失敗しました')
    } finally {
      setSearchingPostal(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await updateDoc(doc(db, 'owners', userId), {
        name: name || null,
        displayName: name || null,
        nameKana: nameKana || null,
        gender: gender || null,
        birthday: birthday || null,
        birthDate: birthday || null,
        phone: phone || null,
        postalCode: postalCode || null,
        prefecture: prefecture || null,
        city: city || null,
        street: street || null,
        building: building || null,
      })
      await reloadOwner()
      onClose()
    } catch (e) {
      setError('保存に失敗しました')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">プロフィールを編集</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-5 space-y-5">
          <Field label="名前">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="名前を入力" className={INPUT} />
          </Field>

          <Field label="ふりがな">
            <input type="text" value={nameKana} onChange={(e) => setNameKana(e.target.value)} placeholder="ふりがなを入力" className={INPUT} />
          </Field>

          <Field label="性別（任意）">
            <div className="flex gap-3">
              {['男性', '女性'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(gender === g ? '' : g)}
                  className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    gender === g
                      ? 'border-orange-400 bg-orange-50 text-orange-600'
                      : 'border-gray-200 bg-white text-gray-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </Field>

          <Field label="生年月日（任意）">
            <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} max={new Date().toISOString().split('T')[0]} className={INPUT} />
          </Field>

          <Field label="電話番号（任意）">
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="電話番号を入力" className={INPUT} />
          </Field>

          <Field label="郵便番号（任意）">
            <div className="flex gap-2">
              <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="例：123-4567" className={`${INPUT} flex-1`} />
              <button
                type="button"
                onClick={searchPostalCode}
                disabled={searchingPostal || !postalCode}
                className="px-4 py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {searchingPostal ? '...' : '検索'}
              </button>
            </div>
          </Field>

          <Field label="都道府県（任意）">
            <input type="text" value={prefecture} onChange={(e) => setPrefecture(e.target.value)} placeholder="都道府県を入力" className={INPUT} />
          </Field>

          <Field label="市区町村（任意）">
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="市区町村を入力" className={INPUT} />
          </Field>

          <Field label="番地（任意）">
            <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="例：1-2-3" className={INPUT} />
          </Field>

          <Field label="建物名（任意）">
            <input type="text" value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="例：○○マンション101号室" className={INPUT} />
          </Field>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '変更を保存'}
          </button>
        </div>
      </div>
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal card */}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {children}
    </div>
  )
}
