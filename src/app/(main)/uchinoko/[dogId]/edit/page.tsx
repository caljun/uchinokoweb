'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  calculateAgeGroup,
  getBreedSize,
  getMixBreedSize,
  calculateTemperamentType,
  calculateDifficultyRank,
  getDifficultyDescription,
  getTemperamentDescription,
  getBreedDescription,
  PURE_BREEDS,
  MIX_BREEDS,
  X_OPTIONS,
  Y_OPTIONS,
  WALK_FREQUENCY_OPTIONS,
} from '@/lib/diagnosis'
import { Dog } from '@/types/dog'

type Step = 0 | 1 | 2

interface FormData {
  name: string
  birthDate: string
  weight: string
  gender: string
  neutered: boolean
  breed: string
  mixBreed1: string
  mixBreed2: string
  photo: File | null
  photoPreview: string | null
  existingPhotoUrl: string | null

  x: number
  y: number
  multiDog: boolean
  toyLover: boolean
  sleepTogether: boolean
  restrictedRoom: boolean
  leadType: string
  walkFrequency: string
}

const INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-gray-800 text-sm'

export default function UchinokoEditPage() {
  const { dogId } = useParams<{ dogId: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<FormData>({
    name: '',
    birthDate: '',
    weight: '',
    gender: 'male',
    neutered: false,
    breed: 'わからない',
    mixBreed1: '',
    mixBreed2: '',
    photo: null,
    photoPreview: null,
    existingPhotoUrl: null,
    x: 0,
    y: 0,
    multiDog: false,
    toyLover: true,
    sleepTogether: false,
    restrictedRoom: false,
    leadType: 'lead',
    walkFrequency: '毎日1回',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // 既存犬データ読み込み
  useEffect(() => {
    if (!user || !dogId) return
    getDoc(doc(db, 'owners', user.uid, 'dogs', dogId)).then((snap) => {
      if (!snap.exists()) { router.push('/uchinoko'); return }
      const dog = { id: snap.id, ...snap.data() } as Dog
      const birthDateStr = dog.birthDate instanceof Date
        ? dog.birthDate.toISOString().split('T')[0]
        : (dog.birthDate as { toDate?: () => Date })?.toDate?.()?.toISOString().split('T')[0] ?? ''
      setForm({
        name: dog.name,
        birthDate: birthDateStr,
        weight: String(dog.weight),
        gender: dog.gender,
        neutered: dog.neutered ?? false,
        breed: dog.breed,
        mixBreed1: dog.mixBreed1 ?? '',
        mixBreed2: dog.mixBreed2 ?? '',
        photo: null,
        photoPreview: dog.photoUrl ?? null,
        existingPhotoUrl: dog.photoUrl ?? null,
        x: dog.x,
        y: dog.y,
        multiDog: dog.multiDog,
        toyLover: dog.toyLover,
        sleepTogether: dog.sleepTogether,
        restrictedRoom: dog.restrictedRoom,
        leadType: dog.leadType,
        walkFrequency: dog.walkFrequency ?? '毎日1回',
      })
      setLoading(false)
    })
  }, [user, dogId, router])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    set('photo', file)
    set('photoPreview', URL.createObjectURL(file))
  }

  const breedSize = form.breed.startsWith('ミックス') && form.mixBreed1 && form.mixBreed2
    ? getMixBreedSize(form.mixBreed1, form.mixBreed2)
    : getBreedSize(form.breed)
  const ageGroup = form.birthDate ? calculateAgeGroup(new Date(form.birthDate), breedSize) : 1
  const temperamentType = calculateTemperamentType(form.x, form.y)
  const difficultyRank = calculateDifficultyRank({
    multiDog: form.multiDog,
    toyLover: form.toyLover,
    sleepTogether: form.sleepTogether,
    restrictedRoom: form.restrictedRoom,
    leadType: form.leadType,
  })
  const difficultyDescription = getDifficultyDescription(difficultyRank, ageGroup, breedSize)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      let photoUrl = form.existingPhotoUrl

      // 新しい写真がある場合はアップロード
      if (form.photo) {
        const storageRef = ref(storage, `owners/${user.uid}/dogs/${dogId}/profile.jpg`)
        await uploadBytes(storageRef, form.photo)
        photoUrl = await getDownloadURL(storageRef)
      }

      await updateDoc(doc(db, 'owners', user.uid, 'dogs', dogId), {
        name: form.name,
        birthDate: new Date(form.birthDate),
        ageGroup,
        weight: parseFloat(form.weight) || 0,
        gender: form.gender,
        neutered: form.neutered,
        breed: form.breed,
        ...(form.breed.startsWith('ミックス') && { mixBreed1: form.mixBreed1 || null, mixBreed2: form.mixBreed2 || null }),
        breedSize,
        x: form.x,
        y: form.y,
        multiDog: form.multiDog,
        toyLover: form.toyLover,
        sleepTogether: form.sleepTogether,
        restrictedRoom: form.restrictedRoom,
        leadType: form.leadType,
        walkFrequency: form.walkFrequency || null,
        temperamentType,
        difficultyRank,
        difficultyDescription,
        photoUrl,
      })

      router.push(`/uchinoko/${dogId}`)
    } catch (e) {
      setError('保存に失敗しました。もう一度お試しください。')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white px-5 pt-5 lg:pt-6 pb-4 sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={() => step === 0 ? router.back() : setStep((step - 1) as Step)} className="text-gray-500">
              ←
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">ウチの子を編集</h1>
              <p className="text-xs text-gray-400">ステップ {step + 1} / 3</p>
            </div>
          </div>
          {/* プログレスバー */}
          <div className="mt-3 flex gap-1.5">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-orange-400' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="px-5 py-6">
          {/* Step 0: 基本情報 */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-800">基本情報</h2>

              {/* 写真 */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center border-2 border-dashed border-orange-300"
                >
                  {form.photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.photoPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🐾</span>
                  )}
                </button>
                <p className="text-xs text-gray-400 mt-2">写真を変更（任意）</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* 名前 */}
              <Field label="名前 *">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="例: ポチ"
                  className={INPUT}
                />
              </Field>

              {/* 生年月日 */}
              <Field label="生年月日 *">
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => set('birthDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={INPUT}
                />
              </Field>

              {/* 体重 */}
              <Field label="体重 (kg) *">
                <input
                  type="number"
                  value={form.weight}
                  onChange={(e) => set('weight', e.target.value)}
                  placeholder="例: 3.5"
                  step="0.1"
                  min="0"
                  className={INPUT}
                />
              </Field>

              {/* 性別 */}
              <Field label="性別 *">
                <div className="flex gap-3">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => set('gender', g)}
                      className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                        form.gender === g
                          ? 'border-orange-400 bg-orange-50 text-orange-600'
                          : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      {g === 'male' ? '♂ オス' : '♀ メス'}
                    </button>
                  ))}
                </div>
              </Field>

              {/* 去勢・避妊 */}
              <Field label="去勢・避妊">
                <div className="flex gap-3">
                  {([true, false] as const).map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => set('neutered', v)}
                      className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                        form.neutered === v
                          ? 'border-orange-400 bg-orange-50 text-orange-600'
                          : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      {v ? '済み' : '未'}
                    </button>
                  ))}
                </div>
              </Field>

              {/* 犬種 */}
              <Field label="犬種 *">
                <select
                  value={form.breed}
                  onChange={(e) => {
                    set('breed', e.target.value)
                    if (!e.target.value.startsWith('ミックス')) {
                      set('mixBreed1', '')
                      set('mixBreed2', '')
                    }
                  }}
                  className={INPUT}
                >
                  <option value="わからない">わからない</option>
                  <optgroup label="純血種">
                    {PURE_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </optgroup>
                  <optgroup label="ミックス">
                    {MIX_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </optgroup>
                </select>
                {form.breed.startsWith('ミックス') && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ミックス 1つ目</p>
                      <select
                        value={form.mixBreed1}
                        onChange={(e) => set('mixBreed1', e.target.value)}
                        className={INPUT}
                      >
                        <option value="">犬種を選択</option>
                        {PURE_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ミックス 2つ目</p>
                      <select
                        value={form.mixBreed2}
                        onChange={(e) => set('mixBreed2', e.target.value)}
                        className={INPUT}
                      >
                        <option value="">犬種を選択</option>
                        {PURE_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </Field>

              <button
                onClick={() => {
                  if (!form.name || !form.birthDate || !form.weight) {
                    setError('名前・生年月日・体重は必須です')
                    return
                  }
                  setError('')
                  setStep(1)
                }}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors"
              >
                次へ →
              </button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          {/* Step 1: 性格診断 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-800">性格と行動を教えてください</h2>

              <Card label="物覚えはどうですか？">
                <div className="flex flex-col gap-2">
                  {X_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => set('x', opt.value)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                        form.x === opt.value
                          ? 'border-orange-400 bg-orange-50 text-orange-600'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card label="テンションはどうですか？">
                <div className="flex flex-col gap-2">
                  {Y_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => set('y', opt.value)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                        form.y === opt.value
                          ? 'border-orange-400 bg-orange-50 text-orange-600'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card label="生活スタイル">
                <div className="space-y-3">
                  <Toggle label="多頭飼いですか？" value={form.multiDog} onChange={(v) => set('multiDog', v)} />
                  <Toggle label="おもちゃで遊びますか？" value={form.toyLover} onChange={(v) => set('toyLover', v)} />
                  <Toggle label="一緒に寝ていますか？" value={form.sleepTogether} onChange={(v) => set('sleepTogether', v)} />
                  <Toggle label="入れない部屋がありますか？" value={form.restrictedRoom} onChange={(v) => set('restrictedRoom', v)} />
                </div>
              </Card>

              <Card label="お散歩スタイル">
                <div className="flex gap-3">
                  {(['lead', 'harness'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => set('leadType', t)}
                      className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                        form.leadType === t
                          ? 'border-orange-400 bg-orange-50 text-orange-600'
                          : 'border-gray-200 bg-white text-gray-500'
                      }`}
                    >
                      {t === 'lead' ? '🐕 リード派' : '🦺 ハーネス派'}
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">散歩頻度</label>
                  <select
                    value={form.walkFrequency}
                    onChange={(e) => set('walkFrequency', e.target.value)}
                    className={INPUT}
                  >
                    {WALK_FREQUENCY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </Card>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors"
              >
                診断結果を見る →
              </button>
            </div>
          )}

          {/* Step 2: 診断結果確認 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">診断結果</h2>

              <div className="space-y-3">
                <p className="text-base font-semibold text-gray-900">タイプ</p>
                <p className="text-sm text-gray-500">{temperamentType}</p>
                <p className="text-sm text-gray-500 leading-relaxed mt-1 whitespace-pre-line">
                  {getTemperamentDescription(temperamentType)}
                </p>
              </div>

              <hr className="border-gray-200" />

              <div className="space-y-3">
                <p className="text-base font-semibold text-gray-900">詳細説明</p>
                {(() => {
                  const breed = getBreedDescription(form.breed)
                  if (breed.purpose) return (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">【{form.breed}の特徴】</p>
                      {breed.origin && <p className="text-sm text-gray-500">原産国: {breed.origin}</p>}
                      <p className="text-sm text-gray-500">目的: {breed.purpose}</p>
                      {breed.pros && <p className="text-sm text-gray-500">長所: {breed.pros}</p>}
                      {breed.cons && <p className="text-sm text-gray-500">短所: {breed.cons}</p>}
                      {breed.chip && <p className="text-sm text-gray-500 leading-relaxed">{breed.chip}</p>}
                    </div>
                  )
                  return null
                })()}
                <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{difficultyDescription}</p>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-gray-100 text-gray-800 rounded-2xl font-semibold text-base"
                >
                  戻る
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-semibold text-base hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '更新する'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== 小コンポーネント =====
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <p className="text-sm font-bold text-gray-700 mb-3">{label}</p>
      {children}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-orange-400' : 'bg-gray-300'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${value ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}
