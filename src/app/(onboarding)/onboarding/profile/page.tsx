'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

const INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-gray-800 text-sm'

export default function OnboardingProfilePage() {
  const { user, owner, reloadOwner } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [nameKana, setNameKana] = useState('')
  const [gender, setGender] = useState('')
  const [birthday, setBirthday] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (owner) {
      setName(owner.name ?? owner.displayName ?? '')
      setNameKana(owner.nameKana ?? '')
      setGender(owner.gender ?? '')
      setBirthday(owner.birthday ?? owner.birthDate ?? '')
      setPhone(owner.phone ?? '')
    }
  }, [owner])

  const handleNext = async () => {
    if (!user) return
    if (!name.trim()) {
      setError('名前を入力してください')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateDoc(doc(db, 'owners', user.uid), {
        name: name.trim(),
        displayName: name.trim(),
        nameKana: nameKana || null,
        gender: gender || null,
        birthday: birthday || null,
        birthDate: birthday || null,
        phone: phone || null,
      })
      await reloadOwner()
      router.push('/onboarding/dog')
    } catch {
      setError('保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ヘッダー */}
      <div className="px-6 pt-12 pb-6">
        <p className="text-2xl font-bold text-orange-500 mb-6">🐾 ウチの子</p>

        <div className="mb-2">
          <p className="text-xs text-gray-400 mb-1">STEP 1 / 2</p>
          <div className="flex gap-1.5">
            <div className="h-1 flex-1 rounded-full bg-orange-400" />
            <div className="h-1 flex-1 rounded-full bg-gray-200" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mt-4">プロフィールを作成</h1>
        <p className="text-sm text-gray-400 mt-1">あなたの基本情報を入力してください</p>
      </div>

      {/* フォーム */}
      <div className="flex-1 px-6 pb-10 space-y-5">
        {/* 名前 */}
        <Field label="名前 *">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前を入力"
            className={INPUT}
          />
        </Field>

        {/* ふりがな */}
        <Field label="ふりがな（任意）">
          <input
            type="text"
            value={nameKana}
            onChange={(e) => setNameKana(e.target.value)}
            placeholder="ふりがなを入力"
            className={INPUT}
          />
        </Field>

        {/* 性別 */}
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

        {/* 生年月日 */}
        <Field label="生年月日（任意）">
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={INPUT}
          />
        </Field>

        {/* 電話番号 */}
        <Field label="電話番号（任意）">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="電話番号を入力"
            className={INPUT}
          />
        </Field>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className="w-full py-4 bg-orange-500 text-white text-base font-bold rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-50 mt-4"
        >
          {saving ? '保存中...' : '次へ →'}
        </button>
      </div>
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
