'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Store, StoreProduct } from '@/types/store'
import {
  ChevronLeft, ChevronRight, Package, Star, ShoppingCart, ArrowLeft, Dog,
} from 'lucide-react'

interface ProductReview {
  reviewId: string
  shopId: string
  productId: string
  userId: string
  userName?: string
  rating: number
  comment?: string
  createdAt?: { toDate?: () => Date }
}

type ProductTab = 'related' | 'dogs' | 'reviews'

export default function ProductDetailPage() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>()
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [product, setProduct] = useState<StoreProduct | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeTab, setActiveTab] = useState<ProductTab>('related')

  useEffect(() => {
    if (!storeId || !productId) return
    getDoc(doc(db, 'shops', storeId)).then((snap) => {
      if (snap.exists()) {
        const storeData = { id: snap.id, ...snap.data() } as Store
        setStore(storeData)
        const found = storeData.products?.find((p) => p.productId === productId) ?? null
        setProduct(found)
      }
      setLoading(false)
    })

    getDocs(
      query(
        collection(db, 'productReviews'),
        where('shopId', '==', storeId),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      )
    ).then((snap) => {
      setReviews(snap.docs.map((d) => ({ reviewId: d.id, ...d.data() } as ProductReview)))
    }).catch(() => {})
  }, [storeId, productId])

  const handleAddToCart = () => {
    // TODO: カート機能実装時に繋ぐ
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return <ProductSkeleton />
  if (!store || !product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <Package size={40} strokeWidth={1.5} />
        <p className="text-sm">商品が見つかりませんでした</p>
      </div>
    )
  }

  const photos = product.photos ?? []
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  // 同店舗の他商品
  const relatedProducts = store.products
    ?.filter((p) => p.productId !== productId && p.isActive !== false && !p.soldOut)
    .slice(0, 4) ?? []

  const tabs: { key: ProductTab; label: string }[] = [
    { key: 'related', label: '関連商品' },
    { key: 'dogs', label: '購入した子' },
    ...(reviews.length > 0 ? [{ key: 'reviews' as ProductTab, label: `レビュー (${reviews.length})` }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">
        {/* 1. 戻る + 店舗名 */}
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Link href={`/search/${storeId}`} className="inline-flex items-center gap-1 text-sm text-orange-500 hover:underline font-medium">
            <span>{store.name}</span>
          </Link>
        </div>

        {/* 2. 写真スライド（ECっぽい正方形カード） */}
        <div className="relative bg-gray-100 rounded-2xl overflow-hidden max-w-md mx-auto aspect-square">
          {photos.length > 0 ? (
            <>
              <Image src={photos[photoIndex]} alt={product.name} fill className="object-cover" />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={56} className="text-gray-300" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* 3. 商品名・レビュー・価格・在庫 */}
        <section className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          {avgRating !== null && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    className={s <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({reviews.length}件)</span>
            </div>
          )}

          {product.price != null && (
            <p className="text-3xl font-bold text-gray-900">
              ¥{product.price.toLocaleString()}
              <span className="text-base font-normal text-gray-400 ml-1">（税込）</span>
            </p>
          )}

          {product.stock != null && (
            <p className={`text-sm font-medium ${product.stock <= 5 ? 'text-red-500' : 'text-green-600'}`}>
              {product.stock <= 0 ? '在庫なし' : product.stock <= 5 ? `残り${product.stock}点` : '在庫あり'}
            </p>
          )}
        </section>

        {/* 4. 詳細説明 */}
        {product.description && (
          <section>
            <div className="bg-white rounded-2xl p-5">
              <p className="text-sm font-bold text-gray-800 mb-2">詳細説明</p>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          </section>
        )}

        {/* 5. タブ（関連商品 / 購入した子）— 店舗詳細と同じ下線スタイル */}
        <section className="space-y-4">
          <div className="bg-white border-b border-gray-200 -mx-6 px-6">
            <div className="flex justify-center gap-12">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key
                      ? 'border-orange-500 text-orange-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'related' && (
            relatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {relatedProducts.map((p) => (
                  <Link key={p.productId} href={`/search/${storeId}/${p.productId}`}>
                    <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-gray-100 relative">
                        {p.photos?.[0] ? (
                          <Image src={p.photos[0]} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-gray-300" strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-gray-800 text-sm truncate">{p.name}</p>
                        {p.price != null && (
                          <p className="text-orange-500 font-bold text-sm mt-0.5">¥{p.price.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">関連商品はまだありません。</p>
            )
          )}

          {activeTab === 'dogs' && (
            <ProductKarteTab storeId={storeId} productId={productId} />
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {reviews.map((review) => {
                const date = review.createdAt?.toDate?.() ?? null
                return (
                  <div key={review.reviewId} className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{review.userName ?? '匿名'}</p>
                        {date && (
                          <p className="text-xs text-gray-400">{date.toLocaleDateString('ja-JP')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* カートバー (モバイル固定) */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 px-5 py-3 flex items-center gap-3 z-40">
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
          >−</button>
          <span className="px-3 py-2 text-sm font-medium min-w-[36px] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.stock ?? 99, q + 1))}
            className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
          >+</button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            added
              ? 'bg-green-500 text-white'
              : product.stock === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          <ShoppingCart size={16} />
          {added ? '追加しました' : 'カートに追加'}
        </button>
      </div>
    </div>
  )
}

// ── 購入した子タブ（公開ギャラリー）──────────────────────────────
interface PurchasedDogEntry {
  docId: string
  ownerId: string
  dogName: string
  dogBreed?: string
  dogPhoto?: string
}

function ProductKarteTab({
  storeId, productId,
}: {
  storeId: string
  productId: string
}) {
  const [dogs, setDogs] = useState<PurchasedDogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(
        query(
          collection(db, 'shops', storeId, 'purchasedDogs'),
          where('isPublic', '==', true),
          where('productIds', 'array-contains', productId)
        )
      )
      const entries: PurchasedDogEntry[] = []
      await Promise.all(
        snap.docs.map(async (d) => {
          const { ownerId, dogId } = d.data() as { ownerId?: string; dogId?: string }
          if (!ownerId || !dogId) return
          try {
            const dogSnap = await getDoc(doc(db, 'owners', ownerId, 'dogs', dogId))
            if (!dogSnap.exists()) return
            const data = dogSnap.data()
            entries.push({
              docId: d.id,
              ownerId,
              dogName: (data.name as string) ?? '名前未設定',
              dogBreed: data.breed as string | undefined,
              dogPhoto: data.photoUrl as string | undefined,
            })
          } catch {
            // アクセス不可の場合はスキップ
          }
        })
      )
      setDogs(entries)
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [storeId, productId])

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (dogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
        <Dog size={36} strokeWidth={1.5} />
        <p className="text-sm">まだ購入した子はいません</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {dogs.map((dog) => (
        <Link key={dog.docId} href={`/dogs/${dog.ownerId}/${dog.docId}`}>
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
            {dog.dogPhoto ? (
              <Image src={dog.dogPhoto} alt={dog.dogName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Dog size={32} className="text-gray-300" strokeWidth={1.5} />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white font-bold text-sm leading-tight">{dog.dogName}</p>
              {dog.dogBreed && <p className="text-white/80 text-xs mt-0.5">{dog.dogBreed}</p>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="px-6 lg:px-10 py-6 max-w-4xl lg:grid lg:grid-cols-2 lg:gap-10">
        <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
        <div className="mt-6 lg:mt-0 space-y-3">
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-56 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mt-4" />
          <div className="h-20 bg-gray-200 rounded animate-pulse mt-4" />
        </div>
      </div>
    </div>
  )
}
