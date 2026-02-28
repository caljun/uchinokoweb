'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Store } from '@/types/store'
import { Search, Store as StoreIcon, Heart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const CATEGORIES = ['すべて', 'トリミング', 'ホテル', 'トレーニング', 'ペットショップ', '動物病院', 'カフェ']

function SearchContent() {
  const searchParams = useSearchParams()
  const { user, owner, toggleFavoriteStore } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [filtered, setFiltered] = useState<Store[]>([])
  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '')
  const [category, setCategory] = useState('すべて')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    getDocs(query(collection(db, 'shops'), where('isPublished', '==', true), limit(50)))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Store))
        setStores(data)
        setFiltered(data)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let result = stores
    if (category !== 'すべて') {
      result = result.filter((s) => s.categories?.includes(category))
    }
    if (keyword.trim()) {
      const kw = keyword.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.address?.toLowerCase().includes(kw) ||
          s.description?.toLowerCase().includes(kw)
      )
    }
    setFiltered(result)
  }, [keyword, category, stores])

  const handleToggleFavorite = async (e: React.MouseEvent, storeId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user || togglingId) return
    setTogglingId(storeId)
    try {
      await toggleFavoriteStore(storeId)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* モバイル: スティッキー検索ヘッダー */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-6 py-4 sticky top-16 z-10">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="店名・住所で検索..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:bg-white"
          />
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5 -mx-1 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* デスクトップ: サイドバー + グリッド */}
      <div className="lg:flex lg:max-w-7xl lg:mx-auto">
        {/* サイドバー (デスクトップのみ) */}
        <aside className="hidden lg:block w-52 shrink-0 border-r border-gray-200 bg-white px-5 py-8 self-start sticky top-16">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">カテゴリ</p>
          <div className="space-y-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-orange-50 text-orange-500'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* メインコンテンツ */}
        <div className="flex-1 px-6 py-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <Search size={40} strokeWidth={1.5} />
              <p className="text-sm">お店が見つかりませんでした</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-4">{filtered.length}件のお店</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {filtered.map((store) => {
                  const isFav = owner?.favoriteStoreIds?.includes(store.id!) ?? false
                  return (
                    <div key={store.id} className="relative">
                      <Link href={`/search/${store.id}`}>
                        <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-square bg-gray-100 relative">
                            {store.photoUrls?.[0] ? (
                              <Image src={store.photoUrls[0]} alt={store.name} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <StoreIcon size={32} className="text-gray-300" strokeWidth={1.5} />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-gray-800 text-sm truncate">{store.name}</p>
                            <p className="text-gray-400 text-xs truncate mt-0.5">{store.address ?? '住所未設定'}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {store.categories?.slice(0, 2).map((cat) => (
                                <span key={cat} className="text-xs bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* ハートボタン（ログイン時のみ表示） */}
                      {user && (
                        <button
                          onClick={(e) => handleToggleFavorite(e, store.id!)}
                          disabled={togglingId === store.id}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center transition-opacity disabled:opacity-60"
                        >
                          <Heart
                            size={16}
                            className={isFav ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}
                          />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SearchContent />
    </Suspense>
  )
}
