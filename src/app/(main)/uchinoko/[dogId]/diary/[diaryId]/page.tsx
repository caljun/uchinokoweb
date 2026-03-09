'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Diary } from '@/types/dog'
import { ChevronLeft, Trash2 } from 'lucide-react'

export default function DiaryDetailPage() {
  const { dogId, diaryId } = useParams<{ dogId: string; diaryId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [diary, setDiary] = useState<Diary | null>(null)
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user || !dogId || !diaryId) return
    const fetch = async () => {
      const snap = await getDoc(doc(db, 'owners', user.uid, 'dogs', dogId, 'diaries', diaryId))
      if (!snap.exists()) {
        router.push(`/uchinoko/${dogId}`)
        return
      }
      setDiary({ id: snap.id, ...snap.data() } as Diary)
      setLoading(false)
    }
    fetch()
  }, [user, dogId, diaryId, router])

  const handleDelete = async () => {
    if (!user) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'owners', user.uid, 'dogs', dogId, 'diaries', diaryId))
      router.push(`/uchinoko/${dogId}`)
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (createdAt: Diary['createdAt']) => {
    const d =
      createdAt instanceof Date
        ? createdAt
        : (createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date()
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!diary) return null

  const photos = diary.photos ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white px-4 pt-5 lg:pt-6 pb-4 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between">
          <button
            onClick={() => router.push(`/uchinoko/${dogId}`)}
            className="flex items-center gap-1 text-gray-500 text-sm"
          >
            <ChevronLeft size={18} />
            戻る
          </button>
          <h1 className="text-base font-bold text-gray-800">日記</h1>
          {(!diary?.createdBy || diary.createdBy.type === 'owner') && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
          {diary?.createdBy?.type === 'shop' && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {diary.createdBy.name}
            </span>
          )}
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* 写真 */}
          {photos.length > 0 && (
            <div>
              <div className="relative w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                <Image
                  src={photos[photoIndex]}
                  alt={`photo ${photoIndex + 1}`}
                  fill
                  className="object-cover"
                />
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center text-lg"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center text-lg"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIndex(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            i === photoIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* サムネイル */}
              {photos.length > 1 && (
                <div className="flex gap-2 mt-2">
                  {photos.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIndex(i)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                        i === photoIndex ? 'border-orange-400' : 'border-transparent'
                      }`}
                    >
                      <Image src={url} alt={`thumb ${i + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 日付 */}
          <p className="text-xs text-gray-400">{formatDate(diary.createdAt)}</p>

          {/* コメント */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {diary.comment}
            </p>
          </div>
        </div>
      </div>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-2">日記を削除しますか？</h2>
            <p className="text-sm text-gray-500 mb-5">この操作は取り消せません。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-40"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
