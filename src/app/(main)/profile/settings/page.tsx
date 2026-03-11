'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, ChevronRight, X, Camera } from 'lucide-react'

export default function ProfileSettingsPage() {
  const { user, owner, signOut, reloadOwner } = useAuth()
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.replace('/uchinoko')
  }

  const handleDeleteAccount = () => {
    alert('アカウント削除は現在準備中です。')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <p className="text-sm text-gray-500">ログインすると設定を変更できます。</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 lg:px-10 py-6">
      <div className="max-w-xl mx-auto space-y-6">

        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900">設定</h1>
        </div>

        <div className="bg-white rounded-xl overflow-hidden">
          <button
            onClick={() => setShowEditModal(true)}
            className="w-full flex items-center gap-3 px-5 py-4 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium border-b border-gray-100"
          >
            <span className="flex-1 text-left">プロフィール編集</span>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-5 py-4 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium border-b border-gray-100"
          >
            ログアウト
          </button>
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center gap-3 px-5 py-4 text-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            アカウント削除
          </button>
        </div>
      </div>

      {showEditModal && owner && (
        <EditProfileModal
          userId={user.uid}
          owner={owner}
          reloadOwner={reloadOwner}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}

function EditProfileModal({
  userId,
  owner,
  reloadOwner,
  onClose,
}: {
  userId: string
  owner: { displayName?: string; name?: string; photoUrl?: string }
  reloadOwner: () => Promise<void>
  onClose: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(owner.displayName ?? owner.name ?? '')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('名前を入力してください')
      return
    }
    setSaving(true)
    setError('')
    try {
      let photoUrl = owner.photoUrl ?? null
      if (photo) {
        const storageRef = ref(storage, `owners/${userId}/profile.jpg`)
        await uploadBytes(storageRef, photo)
        photoUrl = await getDownloadURL(storageRef)
      }
      await updateDoc(doc(db, 'owners', userId), {
        name: name.trim(),
        displayName: name.trim(),
        ...(photoUrl !== (owner.photoUrl ?? null) && { photoUrl }),
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

  const currentPhoto = photoPreview ?? owner.photoUrl ?? null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">プロフィール編集</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-6 space-y-6">
          {/* 写真 */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center group"
            >
              {currentPhoto ? (
                <Image src={currentPhoto} alt="" fill className="object-cover" sizes="96px" />
              ) : (
                <span className="text-3xl font-bold text-orange-400">{name[0] ?? 'U'}</span>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={22} className="text-white" />
              </div>
              <div className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow">
                <Camera size={12} className="text-white" />
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>

          {/* 名前 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名前を入力"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-gray-800 text-sm"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
