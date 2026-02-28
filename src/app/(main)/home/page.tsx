'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, getDocs, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Store, StoreProduct } from '@/types/store'
import { Package, Store as StoreIcon, ArrowRight } from 'lucide-react'
import { ProductCard, StoreCard } from '@/components/home/HomeCards'

type ProductWithStore = { product: StoreProduct; store: Store }

export default function HomePage() {
  const { user, owner, toggleFavoriteStore } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [storeReviews, setStoreReviews] = useState<Record<string, { avgRating: number; reviewCount: number }>>({})
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // 店舗・商品は未ログインでも取得（shops は read: if true）
  useEffect(() => {
    getDocs(query(collection(db, 'shops'), where('isPublished', '==', true), limit(20)))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Store))
        setStores(data)
        const flat: ProductWithStore[] = []
        data.forEach((store) => {
          store.products?.forEach((p) => {
            if (p.productId) flat.push({ product: p, store })
          })
        })
        setProducts(flat)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // レビューはログイン時のみ取得（reviews は request.auth != null 必須）
  useEffect(() => {
    if (!user || stores.length === 0) return
    const ids = stores.map((s) => s.id).filter(Boolean)
    const byStore: Record<string, { sum: number; count: number }> = {}
    ids.forEach((id) => { byStore[id] = { sum: 0, count: 0 } })
    let cancelled = false
    const run = async () => {
      for (let i = 0; i < ids.length; i += 10) {
        if (cancelled) return
        const chunk = ids.slice(i, i + 10)
        try {
          const reviewsSnap = await getDocs(
            query(collection(db, 'reviews'), where('storeId', 'in', chunk))
          )
          if (cancelled) return
          reviewsSnap.docs.forEach((d) => {
            const sid = (d.data() as { storeId?: string }).storeId
            const rating = (d.data() as { rating?: number }).rating
            if (sid && typeof rating === 'number' && byStore[sid]) {
              byStore[sid].sum += rating
              byStore[sid].count += 1
            }
          })
        } catch {
          // 権限エラー時はスキップ
        }
      }
      if (!cancelled) {
        const next: Record<string, { avgRating: number; reviewCount: number }> = {}
        Object.entries(byStore).forEach(([id, { sum, count }]) => {
          next[id] = {
            avgRating: count > 0 ? sum / count : 0,
            reviewCount: count,
          }
        })
        setStoreReviews(next)
      }
    }
    run()
    return () => { cancelled = true }
  }, [user, stores.length])

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
      {/* ウェルカムバナー（モバイルは控えめに） */}
      <div className="bg-white border-b border-gray-100 px-6 lg:px-10 py-4 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {user ? (
            <div>
              <p className="text-xs lg:text-sm text-gray-500">おかえりなさい</p>
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900 mt-0.5">
                {owner?.name ?? owner?.displayName ?? 'オーナー'}さん
              </h1>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-base lg:text-2xl font-bold text-gray-900 leading-tight">愛犬の全てが揃う場所</h1>
                <p className="text-gray-500 text-xs lg:text-sm mt-0.5 lg:mt-1">性格診断・店舗予約・商品購入まで</p>
              </div>
              <Link href="/auth" className="shrink-0">
                <button className="px-4 py-2 lg:px-5 lg:py-2.5 bg-orange-500 text-white text-xs lg:text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
                  無料で始める
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto space-y-12">
        {/* 商品セクション */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">商品</h2>
            <Link href="/home/products" className="flex items-center gap-1 text-sm text-orange-500 hover:underline font-medium">
              もっと見る <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Package size={40} strokeWidth={1.5} />
              <p className="text-sm">商品がありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.slice(0, 8).map(({ product, store }) => (
                <div key={`${store.id}-${product.productId}`}>
                  {/* モバイル: 同一タブ遷移 */}
                  <Link
                    href={`/search/${store.id}/${product.productId}`}
                    className="lg:hidden block"
                  >
                    <ProductCard product={product} store={store} />
                  </Link>
                  {/* デスクトップ: 新しいタブで開く */}
                  <Link
                    href={`/search/${store.id}/${product.productId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden lg:block"
                  >
                    <ProductCard product={product} store={store} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 店舗セクション */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">お店</h2>
            <Link href="/home/stores" className="flex items-center gap-1 text-sm text-orange-500 hover:underline font-medium">
              もっと見る <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
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
              {stores.slice(0, 8).map((store) => {
                const isFav = owner?.favoriteStoreIds?.includes(store.id!) ?? false
                const review = storeReviews[store.id!]
                return (
                  <div key={store.id}>
                    {/* モバイル: 同一タブ遷移 */}
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
                    {/* デスクトップ: 新しいタブで開く */}
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
        </section>
        </div>
      </div>
    </div>
  )
}
