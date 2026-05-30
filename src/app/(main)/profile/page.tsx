'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import type { Dog, Post } from '@/types/dog'
import { PawPrint, Settings, Plus, X } from 'lucide-react'

export default function ProfilePage() {
  const { user, owner } = useAuth()
  const { openAuthModal } = useAuthModal()
  const router = useRouter()
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loadingDogs, setLoadingDogs] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [showPetModal, setShowPetModal] = useState(false)

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), orderBy('createdAt', 'desc')))
      .then(snap => {
        setDogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Dog)))
        setLoadingDogs(false)
      })
    getDocs(query(collection(db, 'posts'), where('ownerId', '==', user.uid), orderBy('postedAt', 'desc')))
      .then(snap => {
        setPosts(snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          postedAt: d.data().postedAt?.toDate?.() ?? new Date(),
        })) as Post[])
        setLoadingPosts(false)
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
          className="w-full max-w-xs py-3 bg-orange-500 text-white rounded-xl font-bold text-sm"
        >
          ログイン / 新規登録
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="max-w-2xl mx-auto flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-500">
            {owner?.photoUrl ? (
              <Image src={owner.photoUrl} alt="" width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              owner?.displayName?.[0] ?? 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-gray-900 truncate">{owner?.displayName ?? 'オーナー'}</p>
            <p className="text-sm text-gray-400 mt-0.5">{owner?.email ?? ''}</p>
          </div>
          <Link href="/profile/settings" className="p-2 text-gray-400">
            <Settings size={20} />
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-8">

        {/* うちの子 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700">ウチの子</h2>
            <button onClick={() => setShowPetModal(true)} className="flex items-center gap-1 text-xs text-orange-500 font-medium">
              <Plus size={14} />
              追加
            </button>
          </div>

          {loadingDogs ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {[1, 2].map(i => <div key={i} className="w-32 flex-shrink-0 bg-gray-200 rounded-xl aspect-[3/4] animate-pulse" />)}
            </div>
          ) : dogs.length === 0 ? (
            <button onClick={() => setShowPetModal(true)} className="w-full">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 text-gray-400">
                <PawPrint size={32} strokeWidth={1.5} />
                <p className="text-sm">最初の子を登録する</p>
              </div>
            </button>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {dogs.map(dog => (
                <Link key={dog.id} href={`/uchinoko/${dog.id}`} className="w-32 flex-shrink-0">
                  <div className="aspect-[3/4] bg-orange-50 rounded-xl overflow-hidden relative">
                    {dog.photoUrl ? (
                      <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" sizes="128px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint size={24} className="text-orange-200" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-medium mt-1 truncate text-center">{dog.name}</p>
                </Link>
              ))}
              <button onClick={() => setShowPetModal(true)} className="w-32 flex-shrink-0">
                <div className="aspect-[3/4] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                  <Plus size={20} className="text-gray-300" />
                </div>
              </button>
            </div>
          )}
        </section>

        {/* 投稿一覧 */}
        <section>
          <h2 className="text-sm font-bold text-gray-700 mb-3">投稿</h2>
          {loadingPosts ? (
            <div className="grid grid-cols-2 gap-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 flex flex-col items-center gap-2 text-gray-400">
              <p className="text-sm">まだ投稿がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {posts.map(post => (
                <div key={post.id} className="aspect-[3/4] relative rounded-lg overflow-hidden bg-gray-100">
                  <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="33vw" />
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* ペット追加モーダル */}
      {showPetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6" onClick={() => setShowPetModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">ウチの子はどっち？</h2>
              <button onClick={() => setShowPetModal(false)} className="text-gray-400"><X size={20} /></button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPetModal(false); router.push('/uchinoko/new') }}
                className="flex-1 flex flex-col items-center gap-2 py-6 bg-orange-50 rounded-xl"
              >
                <span className="text-4xl">🐶</span>
                <span className="font-bold text-gray-800">犬</span>
              </button>
              <button
                onClick={() => { setShowPetModal(false); router.push('/uchinoko/new-cat') }}
                className="flex-1 flex flex-col items-center gap-2 py-6 bg-orange-50 rounded-xl"
              >
                <span className="text-4xl">🐱</span>
                <span className="font-bold text-gray-800">猫</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
