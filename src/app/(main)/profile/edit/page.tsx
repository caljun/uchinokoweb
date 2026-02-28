'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

const INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-gray-800 text-sm'

export default function OwnerEditPage() {
  const { user, owner, reloadOwner } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [nameKana, setNameKana] = useState('')
  const [gender, setGender] = useState('')
  const [birthday, setBirthday] = useState('')
  const [phone, setPhone] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [prefecture, setPrefecture] = useState('')
  const [city, setCity] = useState('')
  const [street, setStreet] = useState('')
  const [building, setBuilding] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchingPostal, setSearchingPostal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (owner) {
      setName(owner.name ?? owner.displayName ?? '')
      setNameKana(owner.nameKana ?? '')
      setGender(owner.gender ?? '')
      setBirthday(owner.birthday ?? owner.birthDate ?? '')
      setPhone(owner.phone ?? '')
      setPostalCode(owner.postalCode ?? '')
      setPrefecture(owner.prefecture ?? '')
      setCity(owner.city ?? '')
      setStreet(owner.street ?? '')
      setBuilding(owner.building ?? '')
    }
  }, [owner])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <p className="text-sm text-gray-500">ログインするとプロフィールを編集できます。</p>
      </div>
    )
  }

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
      if (data.results && data.results.length > 0) {
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
      await updateDoc(doc(db, 'owners', user.uid), {
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
      router.push('/profile/owner')
    } catch (e) {
      setError('保存に失敗しました')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 lg:px-10 py-6">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-lg font-bold text-gray-900">飼い主プロフィールを編集</h1>

        <div className="bg-white rounded-xl p-5 space-y-5">
          {/* 名前 */}
          <Field label="名前">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名前を入力"
              className={INPUT}
            />
          </Field>

          {/* ふりがな */}
          <Field label="ふりがな">
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

          {/* 郵便番号 */}
          <Field label="郵便番号（任意）">
            <div className="flex gap-2">
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="例：123-4567"
                className={`${INPUT} flex-1`}
              />
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

          {/* 都道府県 */}
          <Field label="都道府県（任意）">
            <input
              type="text"
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              placeholder="都道府県を入力"
              className={INPUT}
            />
          </Field>

          {/* 市区町村 */}
          <Field label="市区町村（任意）">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="市区町村を入力"
              className={INPUT}
            />
          </Field>

          {/* 番地 */}
          <Field label="番地（任意）">
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="例：1-2-3"
              className={INPUT}
            />
          </Field>

          {/* 建物名 */}
          <Field label="建物名（任意）">
            <input
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="例：○○マンション101号室"
              className={INPUT}
            />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {children}
    </div>
  )
}
