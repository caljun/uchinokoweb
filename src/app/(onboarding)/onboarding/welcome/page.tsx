'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export default function WelcomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [dogName, setDogName] = useState('')

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), orderBy('createdAt', 'desc'), limit(1)))
      .then((snap) => {
        if (!snap.empty) setDogName(snap.docs[0].data().name ?? '')
      })
      .catch(() => {})
  }, [user])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 pb-10 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">登録完了！</h1>
      <p className="text-gray-500 text-sm mb-12">
        {dogName ? `${dogName}と一緒に` : ''}さっそくミッションをやってみよう
      </p>

      <div className="w-full max-w-sm bg-orange-50 rounded-2xl p-5 mb-10 text-left">
        <p className="text-xs text-orange-400 font-bold mb-2">今日のミッション</p>
        <div className="flex items-center gap-3">
          <span className="text-3xl">📸</span>
          <div>
            <p className="font-bold text-gray-900">正面を向いた写真を撮る</p>
            <p className="text-sm text-orange-500 font-bold mt-0.5">+10pt</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => router.replace('/missions')}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors"
        >
          ミッションをやる →
        </button>
        <button
          onClick={() => router.replace('/uchinoko')}
          className="w-full py-3 text-gray-400 text-sm"
        >
          あとで
        </button>
      </div>
    </div>
  )
}
