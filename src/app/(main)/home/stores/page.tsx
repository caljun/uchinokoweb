'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, getDocs, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Store } from '@/types/store'
import { Store as StoreIcon, ArrowLeft } from 'lucide-react'
import { StoreCard } from '@/components/home/HomeCards'

export default function HomeStoresPage() {
  const { user, owner, toggleFavoriteStore } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [storeReviews, setStoreReviews] = useState<Record<string, { avgRating: number; reviewCount: number }>>({})
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    getDocs(query(collection(db, 'shops'), where('isPublished', '==', true), limit(50)))
      .then(async (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Store))
        setStores(data)

        if (user && data.length > 0) {
          const ids = data.map((s) => s.id).filter(Boolean)
          const byStore: Record<string, { sum: number; count: number }> = {}
          ids.forEach((id) => { byStore[id] = { sum: 0, count: 0 } })
          for (let i = 0; i < ids.length; i += 10) {
            const chunk = ids.slice(i, i + 10)
            try {
              const reviewsSnap = await getDocs(
                query(collection(db, 'reviews'), where('storeId', 'in', chunk))
              )
              reviewsSnap.docs.forEach((d) => {
                const sid = (d.data() as { storeId?: string }).storeId
                const rating = (d.data() as { rating?: number }).rating
                if (sid && typeof rating === 'number' && byStore[sid]) {
                  byStore[sid].sum += rating
                  byStore[sid].count += 1
                }
              })
            } catch {
              // 未ログイン時など権限エラーはスキップ
            }
          }
          const next: Record<string, { avgRating: number; reviewCount: number }> = {}
          Object.entries(byStore).forEach(([id, { sum, count }]) => {
            next[id] = {
              avgRating: count > 0 ? sum / count : 0,
              reviewCount: count,
            }
          })
          setStoreReviews(next)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

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
      <div className="bg-white border-b border-gray-100 px-6 lg:px-10 py-4 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Link
            href="/home"
            className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition-colors rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">お店</h1>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden">
                  <div className="aspect-video bg-gray-200 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <StoreIcon size={40} strokeWidth={1.5} />
              <p className="text-sm">お店がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stores.map((store) => {
                const isFav = owner?.favoriteStoreIds?.includes(store.id!) ?? false
                const review = storeReviews[store.id!]
                return (
                  <div key={store.id}>
                    <Link href={`/search/${store.id}`} className="lg:hidden block">
                      <StoreCard
                        store={store}
                        avgRating={review?.avgRating ?? 0}
                        reviewCount={review?.reviewCount ?? 0}
                        isFav={isFav}
                        showFavorite={!!user}
                        onFavoriteClick={(e) => handleToggleFavorite(e, store.id!)}
                        toggling={togglingId === store.id}
                      />
                    </Link>
                    <Link
                      href={`/search/${store.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden lg:block"
                    >
                      <StoreCard
                        store={store}
                        avgRating={review?.avgRating ?? 0}
                        reviewCount={review?.reviewCount ?? 0}
                        isFav={isFav}
                        showFavorite={!!user}
                        onFavoriteClick={(e) => handleToggleFavorite(e, store.id!)}
                        toggling={togglingId === store.id}
                      />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
