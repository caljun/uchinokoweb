'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { collection, addDoc, serverTimestamp, doc, runTransaction, increment } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Camera } from 'lucide-react'

const CAT_BREEDS = [
  '日本猫（雑種）',
  'アメリカンショートヘア',
  'スコティッシュフォールド',
  'マンチカン',
  'ペルシャ',
  'ラグドール',
  'ノルウェージャンフォレストキャット',
  'メインクーン',
  'シャム',
  'ロシアンブルー',
  'ベンガル',
  'ブリティッシュショートヘア',
  'アビシニアン',
  'わからない',
]

const COAT_PATTERNS = [
  { value: '白', label: '白', color: '#f8f8f8', border: true },
  { value: '黒', label: '黒', color: '#1a1a1a' },
  { value: 'グレー', label: 'グレー', color: '#9ca3af' },
  { value: '茶', label: '茶', color: '#92400e' },
  { value: 'クリーム', label: 'クリーム', color: '#fde68a' },
  { value: '茶トラ', label: '茶トラ', color: '#d97706' },
  { value: 'キジトラ', label: 'キジトラ', color: '#78716c' },
  { value: 'グレートラ', label: 'グレートラ', color: '#6b7280' },
  { value: '三毛', label: '三毛', color: '#f97316' },
  { value: 'サビ', label: 'サビ', color: '#b45309' },
  { value: 'はちわれ', label: 'はちわれ', color: '#374151' },
  { value: '白黒', label: '白黒', color: '#111827' },
]

function calculateCatAgeGroup(birthDate: Date): number {
  const now = new Date()
  const months = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth())
  if (months < 12) return 0   // 子猫期
  if (months < 84) return 1   // 成猫期（〜7歳）
  return 2                    // シニア期
}

interface FormData {
  name: string
  birthDate: string
  weight: string
  gender: string
  neutered: boolean
  breed: string
  coatPattern: string
  photo: File | null
  photoPreview: string | null
}

const initialForm: FormData = {
  name: '',
  birthDate: '',
  weight: '',
  gender: 'male',
  neutered: false,
  breed: '日本猫（雑種）',
  coatPattern: '',
  photo: null,
  photoPreview: null,
}

export default function NewCatPage() {
  const [form, setForm] = useState<FormData>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, owner, reloadOwner } = useAuth()
  const router = useRouter()

  const set = (key: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    set('photo', file)
    set('photoPreview', URL.createObjectURL(file))
  }

  const canSave = form.name.trim() && form.birthDate && form.coatPattern

  const handleSave = async () => {
    if (!user || !canSave) return
    setSaving(true)
    setError('')
    try {
      const birthDate = new Date(form.birthDate)
      const ageGroup = calculateCatAgeGroup(birthDate)

      const docRef = await addDoc(collection(db, 'owners', user.uid, 'dogs'), {
        petType: 'cat',
        name: form.name.trim(),
        birthDate,
        ageGroup,
        weight: parseFloat(form.weight) || 0,
        gender: form.gender,
        neutered: form.neutered,
        breed: form.breed,
        breedSize: 0,
        coatPattern: form.coatPattern,
        // 診断フィールドは猫には不要だが型の都合でデフォルト値を入れる
        x: 0,
        y: 0,
        multiDog: false,
        toyLover: false,
        sleepTogether: false,
        restrictedRoom: false,
        leadType: '',
        hospitalHistory: false,
        allergy: false,
        temperamentType: '',
        difficultyRank: '',
        difficultyDescription: '',
        isPublic: false,
        createdAt: serverTimestamp(),
      })

      if (form.photo) {
        const storageRef = ref(storage, `owners/${user.uid}/dogs/${docRef.id}/profile.jpg`)
        await uploadBytes(storageRef, form.photo)
        const photoUrl = await getDownloadURL(storageRef)
        const { doc: docFn, updateDoc } = await import('firebase/firestore')
        await updateDoc(docFn(db, 'owners', user.uid, 'dogs', docRef.id), { photoUrl })
      }

      if (owner?.pendingPoints && owner.pendingPoints > 0) {
        await runTransaction(db, async (tx) => {
          const ownerRef = doc(db, 'owners', user.uid)
          const ownerSnap = await tx.get(ownerRef)
          const pending = (ownerSnap.data()?.pendingPoints as number) ?? 0
          if (pending > 0) {
            tx.update(doc(db, 'owners', user.uid, 'dogs', docRef.id), {
              totalPoints: increment(pending),
              weeklyPoints: increment(pending),
            })
            tx.update(ownerRef, { pendingPoints: 0 })
          }
        })
        await reloadOwner()
      }

      router.push(`/uchinoko/${docRef.id}`)
    } catch (e) {
      setError('保存に失敗しました。もう一度お試しください。')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white px-5 pt-5 lg:pt-6 pb-4 sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-gray-500">←</button>
            <h1 className="text-lg font-bold text-gray-800">🐱 ウチの子を登録（猫）</h1>
          </div>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* 写真 */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 rounded-full bg-orange-50 border-2 border-dashed border-orange-300 flex items-center justify-center overflow-hidden hover:bg-orange-100 transition-colors"
            >
              {form.photoPreview ? (
                <Image src={form.photoPreview} alt="preview" width={112} height={112} className="object-cover w-full h-full" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-orange-400">
                  <Camera size={24} />
                  <span className="text-xs">写真を追加</span>
                </div>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* 名前 */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">名前 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="例：モモ"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          {/* 生年月日 */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">生年月日</label>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          {/* 体重 */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">体重（kg）</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
              placeholder="例：4.2"
              step="0.1"
              min="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          {/* 性別 */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">性別</label>
            <div className="flex gap-3">
              {[{ v: 'male', l: 'オス' }, { v: 'female', l: 'メス' }].map(({ v, l }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('gender', v)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${
                    form.gender === v
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* 去勢・避妊 */}
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-sm font-bold text-gray-700">去勢・避妊手術済み</span>
            <button
              type="button"
              onClick={() => set('neutered', !form.neutered)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.neutered ? 'bg-orange-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.neutered ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* 品種 */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700">品種</label>
            <select
              value={form.breed}
              onChange={(e) => set('breed', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 bg-white"
            >
              {CAT_BREEDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 毛色・柄 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">毛色・柄 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-4 gap-2">
              {COAT_PATTERNS.map(({ value, label, color, border }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('coatPattern', value)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-colors ${
                    form.coatPattern === value ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full ${border ? 'border border-gray-300' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-700 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* 保存ボタン */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            {saving ? '保存中...' : '登録する'}
          </button>
        </div>
      </div>
    </div>
  )
}
