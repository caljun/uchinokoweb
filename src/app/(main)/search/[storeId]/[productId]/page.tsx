'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Store, StoreProduct } from '@/types/store'
import {
  ChevronLeft, ChevronRight, Package, Star, ShoppingCart,
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

type ProductTab = 'related' | 'dogs'

export default function ProductDetailPage() {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>()
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

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-8">
        {/* 1. 店舗名 */}
        <Link href={`/search/${storeId}`} className="inline-flex items-center gap-1 text-sm text-orange-500 hover:underline font-medium">
          <span>{store.name}</span>
        </Link>

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

        {/* 5. タブ（関連商品 / 購入した子） */}
        <section className="space-y-4">
          <div className="bg-white rounded-full p-1 flex justify-center gap-1">
            <button
              onClick={() => setActiveTab('related')}
              className={`flex-1 py-2 text-sm font-medium rounded-full ${
                activeTab === 'related' ? 'bg-orange-500 text-white' : 'text-gray-500'
              }`}
            >
              関連商品
            </button>
            <button
              onClick={() => setActiveTab('dogs')}
              className={`flex-1 py-2 text-sm font-medium rounded-full ${
                activeTab === 'dogs' ? 'bg-orange-500 text-white' : 'text-gray-500'
              }`}
            >
              購入した子
            </button>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'related' ? (
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
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">購入した子の表示は現在準備中です。</p>
          )}

          {/* レビュー一覧（そのまま下に） */}
          {reviews.length > 0 && (
            <div className="mt-4 space-y-3">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                レビュー
                <span className="text-base font-normal text-gray-400 ml-2">({reviews.length}件)</span>
              </h2>
              {reviews.slice(0, 5).map((review) => {
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
