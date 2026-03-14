'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, limit, orderBy, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Camera, Trophy, Star } from 'lucide-react'

type State = 'idle' | 'uploading' | 'success'

export default function WelcomePage() {
  const router = useRouter()
  const { user, addMissionPoints } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dogName, setDogName] = useState('')
  const [dogId, setDogId] = useState('')
  const [state, setState] = useState<State>('idle')

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), orderBy('createdAt', 'desc'), limit(1)))
      .then((snap) => {
        if (!snap.empty) {
          const d = snap.docs[0]
          setDogName(d.data().name ?? '')
          setDogId(d.id)
        }
      })
      .catch(() => {})
  }, [user])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !dogId) return
    e.target.value = ''

    setState('uploading')
    try {
      const today = (() => {
        const now = new Date()
        return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
      })()
      const path = `owners/${user.uid}/dogs/${dogId}/missionPhotos/${today}_photo_post.jpg`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const photoUrl = await getDownloadURL(storageRef)

      await addMissionPoints(dogId, 'photo_post', 10)

      await setDoc(
        doc(collection(db, 'owners', user.uid, 'dogs', dogId, 'diaries')),
        {
          photos: [photoUrl],
          comment: 'ミッション達成！「今日の一枚」',
          dogId,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
        }
      )

      setState('success')
    } catch {
      setState('idle')
    }
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pb-10 text-center">
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ミッションクリア！</h1>
        <div className="flex items-center justify-center gap-1.5 mt-2 mb-10">
          <Star size={18} className="text-orange-400" fill="currentColor" />
          <span className="text-xl font-black text-orange-500">+10ポイント獲得！</span>
        </div>

        <div className="w-full max-w-sm bg-orange-50 rounded-2xl p-5 mb-8 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-orange-500" />
            <p className="text-sm font-bold text-orange-500">ランキングとは？</p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            ミッションをこなすごとにポイントが貯まり、<span className="font-bold">毎週リセット</span>されるランキングで順位が決まります。
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mt-2">
            毎日ミッションをこなして、<span className="font-bold">ウチの子を1位</span>にしよう！
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => router.replace('/ranking')}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors"
          >
            ランキングを見る →
          </button>
          <button
            onClick={() => router.replace('/missions')}
            className="w-full py-3 text-gray-400 text-sm"
          >
            ミッションをもっとやる
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="text-6xl mb-4">📸</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">登録完了！</h1>
      <p className="text-gray-500 text-sm mb-8">
        {dogName ? `${dogName}の写真を撮って` : ''}さっそく最初のミッションをやってみよう
      </p>

      <div className="w-full max-w-sm bg-orange-50 rounded-2xl p-5 mb-8 text-left">
        <p className="text-xs text-orange-400 font-bold mb-2">最初のミッション</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl">📸</span>
          <div>
            <p className="font-bold text-gray-900">今日の一枚を撮る</p>
            <p className="text-sm text-gray-500 mt-0.5">どんな写真でもOK！</p>
            <p className="text-sm text-orange-500 font-bold mt-0.5">+10ポイント</p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={state === 'uploading'}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {state === 'uploading' ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              アップロード中...
            </>
          ) : (
            <>
              <Camera size={20} />
              {dogName ? `${dogName}の写真を撮る` : '写真を撮る'}
            </>
          )}
        </button>
        <button
          onClick={() => router.replace('/uchinoko')}
          disabled={state === 'uploading'}
          className="w-full py-3 text-gray-400 text-sm disabled:opacity-40"
        >
          あとで
        </button>
      </div>
    </div>
  )
}
