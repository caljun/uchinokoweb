'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import {
  getBreedSize,
  getMixBreedSize,
  PURE_BREEDS,
  MIX_BREEDS,
} from '@/lib/diagnosis'
import {
  getBreedGroup,
  getSexType,
  getMentorAgeGroup,
  calcPowerScore,
  getMentorStatus,
  DIAGNOSIS_QUESTIONS,
} from '@/lib/mentorDiagnosis'

type Step = 0 | 1 | 2

interface FormData {
  // Step0: 基本情報
  name: string
  birthDate: string
  weight: string
  gender: string       // "male" | "female"
  neutered: boolean
  breed: string
  mixBreed1: string
  mixBreed2: string
  photo: File | null
  photoPreview: string | null

  // Step1: 6つの環境質問（1〜3）
  answers: number[]
}

const initialForm: FormData = {
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
  answers: [0, 0, 0, 0, 0, 0],
}

export default function UchinokoNewPage() {
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<FormData>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, setHasDog } = useAuth()
  const router = useRouter()

  const set = (key: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const setAnswer = (index: number, value: number) =>
    setForm((prev) => {
      const next = [...prev.answers]
      next[index] = value
      return { ...prev, answers: next }
    })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    set('photo', file)
    set('photoPreview', URL.createObjectURL(file))
  }

  const breedSize = form.breed.startsWith('ミックス') && form.mixBreed1 && form.mixBreed2
    ? getMixBreedSize(form.mixBreed1, form.mixBreed2)
    : getBreedSize(form.breed)

  const breedGroup = getBreedGroup(form.breed)
  const sexType = getSexType(form.gender, form.neutered)
  const mentorAgeGroup = form.birthDate ? getMentorAgeGroup(new Date(form.birthDate)) : 'adult'
  const powerScore = form.answers.every((a) => a > 0)
    ? calcPowerScore(breedGroup, sexType, mentorAgeGroup, form.answers)
    : null
  const mentorStatus = powerScore !== null ? getMentorStatus(powerScore) : null

  const allAnswered = form.answers.every((a) => a > 0)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const docRef = await addDoc(collection(db, 'owners', user.uid, 'dogs'), {
        name: form.name,
        birthDate: new Date(form.birthDate),
        weight: parseFloat(form.weight) || 0,
        gender: form.gender,
        neutered: form.neutered,
        breed: form.breed,
        ...(form.breed.startsWith('ミックス') && { mixBreed1: form.mixBreed1 || null, mixBreed2: form.mixBreed2 || null }),
        breedSize,
        breedGroup,
        sex: sexType,
        mentorAgeGroup,
        powerScore,
        mentorStatus,
        diagnosisAnswers: form.answers,
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

      setHasDog(true)
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
            <button onClick={() => step === 0 ? router.back() : setStep((step - 1) as Step)} className="text-gray-500">
              ←
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">ウチの子を登録</h1>
              <p className="text-xs text-gray-400">ステップ {step + 1} / 3</p>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            {[0, 1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-orange-400' : 'bg-gray-200'}`} />
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
                <p className="text-xs text-gray-400 mt-2">写真を追加（任意）</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <Field label="名前 *">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="例: ポチ"
                  className={INPUT}
                />
              </Field>

              <Field label="生年月日 *">
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => set('birthDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={INPUT}
                />
              </Field>

              <Field label="体重 (kg)">
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
                      <select value={form.mixBreed1} onChange={(e) => set('mixBreed1', e.target.value)} className={INPUT}>
                        <option value="">犬種を選択</option>
                        {PURE_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ミックス 2つ目</p>
                      <select value={form.mixBreed2} onChange={(e) => set('mixBreed2', e.target.value)} className={INPUT}>
                        <option value="">犬種を選択</option>
                        {PURE_BREEDS.map((b) => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </Field>

              <button
                onClick={() => {
                  if (!form.name || !form.birthDate) {
                    setError('名前と生年月日は必須です')
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

          {/* Step 1: 6つの環境質問 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800">環境チェック</h2>
                <p className="text-sm text-gray-500 mt-1">正直に答えるほど、正確なパワー値が出ます</p>
              </div>

              {DIAGNOSIS_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <p className="text-sm font-bold text-gray-700 mb-3">Q{q.id}. {q.question}</p>
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setAnswer(idx, opt.value)}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                          form.answers[idx] === opt.value
                            ? 'border-orange-400 bg-orange-50 text-orange-700'
                            : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  if (!allAnswered) {
                    setError('すべての質問に答えてください')
                    return
                  }
                  setError('')
                  setStep(2)
                }}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors"
              >
                診断結果を見る →
              </button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          {/* Step 2: 診断結果 */}
          {step === 2 && powerScore !== null && mentorStatus !== null && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">診断結果</h2>

              {/* パワー値カード */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-1">パワー値</p>
                <p className="text-6xl font-black text-orange-500 mb-2">{powerScore}</p>
                <div className="inline-flex items-center gap-2 bg-orange-50 rounded-full px-4 py-1.5">
                  <span className="text-lg">
                    {mentorStatus === 'overheat' ? '🔴' :
                     mentorStatus === 'high_energy' ? '🟠' :
                     mentorStatus === 'standard' ? '🟡' : '🟢'}
                  </span>
                  <span className="font-bold text-orange-700">
                    {mentorStatus === 'overheat' ? 'オーバーヒート' :
                     mentorStatus === 'high_energy' ? 'ハイ・エナジー' :
                     mentorStatus === 'standard' ? 'スタンダード' : 'セラピー候補'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {mentorStatus === 'overheat' && '環境による異常値。休息と環境改善が最優先です。まずは第1章「脳の冷却」から始めましょう。'}
                  {mentorStatus === 'high_energy' && 'パワフルな個性。適切な「仕事」を与えることが鍵です。ミッションで一緒に取り組みましょう。'}
                  {mentorStatus === 'standard' && '安定圏内。メンターの導きで名犬になれます。ミッションを続けてスコアを下げていきましょう。'}
                  {mentorStatus === 'therapy' && '究極の安定。周囲を癒やす素質があります。この状態を維持しながら才能を伸ばしましょう。'}
                </p>
              </div>

              <p className="text-xs text-gray-400 text-center">
                このスコアはミッションをこなすことで下がっていきます
              </p>

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
                  {saving ? '保存中...' : '登録する'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-gray-800 text-sm'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
