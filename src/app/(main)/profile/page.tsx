'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { Dog } from '@/types/dog'
import { PawPrint, UserPlus, Settings, ChevronRight, Plus, Copy, Check } from 'lucide-react'

export default function ProfilePage() {
  const { user, owner } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [copied, setCopied] = useState(false)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loadingDogs, setLoadingDogs] = useState(true)

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        setDogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dog)))
        setLoadingDogs(false)
      })
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 gap-5">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <PawPrint size={40} strokeWidth={1.5} className="text-gray-300" />
        </div>
        <p className="text-gray-500 text-center text-sm">ログインするとマイページを見られます</p>
        <button
          type="button"
          onClick={openAuthModal}
          className="w-full max-w-xs py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
        >
          ログイン / 新規登録
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          {/* アバター */}
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-500">
            {owner?.photoUrl ? (
              <Image src={owner.photoUrl} alt="" width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              owner?.displayName?.[0] ?? 'U'
            )}
          </div>
          {/* 名前・ポイント */}
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-gray-900 truncate">{owner?.displayName ?? 'オーナー'}</p>
            <button
              type="button"
              onClick={() => {
                if (!owner?.friendId) return
                navigator.clipboard.writeText(owner.friendId)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="flex items-center gap-1 mt-0.5 text-sm text-gray-400 hover:text-orange-500 transition-colors"
            >
              <span>ID: {owner?.friendId ?? '—'}</span>
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2.5 py-1 rounded-full">
                {owner?.totalPoints ?? 0}pt
              </span>
            </div>
          </div>
          {/* 設定 */}
          <Link href="/profile/settings" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings size={20} />
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">

        {/* うちの子 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">ウチの子</h2>
            <Link href="/uchinoko/new" className="flex items-center gap-1 text-xs text-orange-500 font-medium">
              <Plus size={14} />
              追加
            </Link>
          </div>

          {loadingDogs ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {[1, 2].map((i) => (
                <div key={i} className="w-28 flex-shrink-0 bg-gray-200 rounded-xl aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : dogs.length === 0 ? (
            <Link href="/uchinoko/new">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors">
                <PawPrint size={32} strokeWidth={1.5} />
                <p className="text-sm">最初の子を登録する</p>
              </div>
            </Link>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {dogs.map((dog) => (
                <Link key={dog.id} href={`/uchinoko/${dog.id}`} className="w-28 flex-shrink-0">
                  <div className="aspect-[3/4] bg-orange-50 rounded-xl overflow-hidden relative hover:shadow-md transition-shadow">
                    {dog.photoUrl ? (
                      <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" sizes="112px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint size={28} className="text-orange-200" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              <Link href="/uchinoko/new" className="w-28 flex-shrink-0">
                <div className="aspect-[3/4] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center hover:border-orange-300 transition-colors">
                  <Plus size={24} className="text-gray-300" />
                </div>
              </Link>
            </div>
          )}
        </section>

        {/* 友達 */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3">友達</h2>
          <Link
            href="/profile/friends"
            className="bg-white rounded-xl flex items-center gap-3 px-5 py-4 hover:bg-orange-50 transition-colors"
          >
            <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <UserPlus size={18} className="text-orange-500" />
            </div>
            <p className="flex-1 text-sm font-medium text-gray-800">友達を探す・管理する</p>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        </section>

      </div>
    </div>
  )
}
