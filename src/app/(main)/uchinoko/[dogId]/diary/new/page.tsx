'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export default function DiaryNewPage() {
  const { dogId } = useParams<{ dogId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = 3 - photos.length
    const newFiles = files.slice(0, remaining)
    setPhotos((prev) => [...prev, ...newFiles])
    setPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))])
  }

  const removePhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    if (!user || !comment.trim()) return
    setSaving(true)
    try {
      const docRef = await addDoc(
        collection(db, 'owners', user.uid, 'dogs', dogId, 'diaries'),
        {
          dogId,
          ownerId: user.uid,
          comment,
          photos: [],
          createdAt: serverTimestamp(),
        }
      )

      // 写真アップロード（最大3枚）
      const uploadedUrls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const storageRef = ref(
          storage,
          `owners/${user.uid}/dogs/${dogId}/diaries/${docRef.id}/photo_${i}.jpg`
        )
        await uploadBytes(storageRef, photos[i])
        const url = await getDownloadURL(storageRef)
        uploadedUrls.push(url)
      }

      if (uploadedUrls.length > 0) {
        const { doc, updateDoc } = await import('firebase/firestore')
        await updateDoc(doc(db, 'owners', user.uid, 'dogs', dogId, 'diaries', docRef.id), {
          photos: uploadedUrls,
        })
      }

      router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white px-5 pt-5 lg:pt-6 pb-4 sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="text-gray-500 text-sm">キャンセル</button>
            <h1 className="text-base font-bold text-gray-800">日記を書く</h1>
            <button
              onClick={handleSave}
              disabled={saving || !comment.trim()}
              className="text-orange-500 font-bold text-sm disabled:opacity-40"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* 写真 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">写真（最大3枚）</p>
            <div className="flex gap-3 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative w-24 h-24">
                  <Image src={src} alt={`photo ${i}`} fill className="object-cover rounded-xl" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400"
                >
                  <span className="text-2xl">+</span>
                  <span className="text-xs">追加</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoAdd}
              />
            </div>
          </div>

          {/* コメント */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">コメント *</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 100))}
              placeholder="今日のうちの子の様子を書いてね..."
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/100</p>
          </div>
        </div>
      </div>
    </div>
  )
}
