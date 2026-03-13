'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export default function OnboardingProfilePage() {
  const { user, reloadOwner } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleNext = async () => {
    if (!user) return
    if (!photo) {
      setError('写真を選んでください')
      return
    }
    setSaving(true)
    setError('')
    try {
      const storageRef = ref(storage, `owners/${user.uid}/profile.jpg`)
      await uploadBytes(storageRef, photo)
      const photoUrl = await getDownloadURL(storageRef)
      await updateDoc(doc(db, 'owners', user.uid), { photoUrl })
      await reloadOwner()
      router.push('/onboarding/dog')
    } catch {
      setError('保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-16 pb-10">
      <div className="mb-8">
        <p className="text-xs text-gray-400 mb-1">STEP 1 / 2</p>
        <div className="flex gap-1.5">
          <div className="h-1 flex-1 rounded-full bg-orange-400" />
          <div className="h-1 flex-1 rounded-full bg-gray-200" />
        </div>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1">プロフィール写真</h1>
      <p className="text-sm text-gray-400 mb-10">あなたの写真を設定しましょう</p>

      <div className="flex flex-col items-center gap-4 mb-10">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-32 h-32 rounded-full overflow-hidden bg-orange-50 flex items-center justify-center border-2 border-dashed border-orange-300"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">👤</span>
          )}
        </button>
        <p className="text-sm text-orange-500 font-medium">タップして写真を選ぶ</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
      </div>

      {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

      <div className="mt-auto space-y-3">
        <button
          onClick={handleNext}
          disabled={saving}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {saving ? '保存中...' : '次へ →'}
        </button>
        <button
          onClick={() => router.push('/onboarding/dog')}
          className="w-full py-3 text-gray-400 text-sm"
        >
          スキップ
        </button>
      </div>
    </div>
  )
}
