'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { collection, query, getDocs, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Store, StoreProduct } from '@/types/store'
import { Package, Store as StoreIcon, ArrowRight, Heart, Star } from 'lucide-react'

type ProductWithStore = { product: StoreProduct; store: Store }

export default function HomePage() {
  const { user, owner, toggleFavoriteStore } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [storeReviews, setStoreReviews] = useState<Record<string, { avgRating: number; reviewCount: number }>>({})
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    getDocs(query(collection(db, 'shops'), where('isPublished', '==', true), limit(20)))
      .then(async (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Store))
        setStores(data)
        const flat: ProductWithStore[] = []
        data.forEach((store) => {
          store.products?.forEach((p) => {
            if (p.productId) flat.push({ product: p, store })
          })
        })
        setProducts(flat)

        const ids = data.map((s) => s.id).filter(Boolean)
        if (ids.length > 0) {
          const byStore: Record<string, { sum: number; count: number }> = {}
          ids.forEach((id) => { byStore[id] = { sum: 0, count: 0 } })
          for (let i = 0; i < ids.length; i += 10) {
            const chunk = ids.slice(i, i + 10)
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
  }, [])

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
      {/* ウェルカムバナー */}
      <div className="bg-white border-b border-gray-100 px-6 lg:px-10 py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {user ? (
            <div>
              <p className="text-sm text-gray-500">おかえりなさい</p>
              <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
                {owner?.name ?? owner?.displayName ?? 'オーナー'}さん
              </h1>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">わんちゃんと飼い主をつなぐ</h1>
                <p className="text-gray-500 text-sm mt-1">性格診断・店舗予約・商品購入まで</p>
              </div>
              <Link href="/auth">
                <button className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
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
            <Link href="/search" className="flex items-center gap-1 text-sm text-orange-500 hover:underline font-medium">
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
            <Link href="/search" className="flex items-center gap-1 text-sm text-orange-500 hover:underline font-medium">
              もっと見る <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
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

// ── 小コンポーネント ────────────────────────────────────────────────
function ProductCard({ product, store }: { product: StoreProduct; store: Store }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 relative">
        {product.photos?.[0] ? (
          <Image src={product.photos[0]} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-gray-300" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-400 truncate">{store.name}</p>
        <p className="font-medium text-gray-800 text-sm truncate mt-0.5">{product.name}</p>
        {product.price != null && (
          <p className="text-orange-500 font-bold text-sm mt-1">
            ¥{product.price.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

function StoreCard({
  store,
  avgRating,
  reviewCount,
  isFav,
  showFavorite,
  onFavoriteClick,
  toggling,
}: {
  store: Store
  avgRating: number
  reviewCount: number
  isFav: boolean
  showFavorite: boolean
  onFavoriteClick: (e: React.MouseEvent) => void
  toggling: boolean
}) {
  return (
    <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* 写真 16:9 */}
      <div className="aspect-video bg-gray-100 relative">
        {store.photoUrls?.[0] ? (
          <Image src={store.photoUrls[0]} alt={store.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <StoreIcon size={32} className="text-gray-300" strokeWidth={1.5} />
          </div>
        )}
      </div>
      {/* 下: 店舗名＋お気に入り の行、その下に星・評価・件数 */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-gray-800 text-sm truncate min-w-0">{store.name}</p>
          {showFavorite && (
            <button
              type="button"
              onClick={onFavoriteClick}
              disabled={toggling}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-opacity disabled:opacity-60 hover:bg-gray-100"
            >
              <Heart
                size={16}
                className={isFav ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}
              />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 text-sm">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={12}
                className={
                  reviewCount > 0 && s <= Math.round(avgRating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200 fill-gray-200'
                }
              />
            ))}
          </div>
          {reviewCount > 0 ? (
            <>
              <span className="text-gray-700">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({reviewCount}件)</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">-- (0件)</span>
          )}
        </div>
      </div>
    </div>
  )
}
