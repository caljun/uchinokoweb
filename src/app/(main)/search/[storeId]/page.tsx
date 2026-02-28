'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Store, StoreProduct } from '@/types/store'
import {
  MapPin, Phone, Mail, Clock, ChevronLeft, ChevronRight,
  Package, Store as StoreIcon, Star, ArrowLeft,
} from 'lucide-react'

type Tab = 'info' | 'products' | 'dogs'

export default function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [photoIndex, setPhotoIndex] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    if (!storeId) return
    const load = async () => {
      const snap = await getDoc(doc(db, 'shops', storeId))
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Store
        setStore(data)
      }

      // reviews コレクションから店舗レビューを集計（iOS と同じロジック）
      const reviewsSnap = await getDocs(
        query(collection(db, 'reviews'), where('storeId', '==', storeId))
      )
      const ratings = reviewsSnap.docs
        .map((d) => (d.data() as { rating?: number }).rating)
        .filter((r): r is number => typeof r === 'number')

      if (ratings.length > 0) {
        const total = ratings.reduce((sum, r) => sum + r, 0)
        setAvgRating(total / ratings.length)
        setReviewCount(ratings.length)
      } else {
        setAvgRating(0)
        setReviewCount(0)
      }

      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [storeId])

  if (loading) return <StoreSkeleton />
  if (!store) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <StoreIcon size={40} strokeWidth={1.5} />
        <p className="text-sm">お店が見つかりませんでした</p>
      </div>
    )
  }

  const photos = store.photoUrls ?? []
  const activeProducts = store.products?.filter((p) => p.isActive !== false && !p.soldOut) ?? []
  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: '基本情報' },
    ...(activeProducts.length > 0 ? [{ key: 'products' as Tab, label: '商品' }] : []),
    { key: 'dogs', label: '来店犬' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 写真ギャラリー */}
      <div className="relative bg-gray-200 aspect-video lg:aspect-[21/9] overflow-hidden lg:max-w-3xl lg:mx-auto">
        <button
          onClick={() => router.back()}
          className="absolute top-3 left-3 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        {photos.length > 0 ? (
          <>
            <Image src={photos[photoIndex]} alt={store.name} fill className="object-cover" />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                >
                  <ChevronRight size={20} />
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
            <StoreIcon size={56} className="text-gray-300" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* 店舗名・レビュー・住所 */}
      <div className="bg-white border-b border-gray-100 px-6 lg:px-10 py-5 space-y-2 text-center lg:max-w-3xl lg:mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
        <div className="flex items-center justify-center gap-1.5 text-sm">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
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
            <span className="text-xs text-gray-400">--</span>
          )}
        </div>
        {store.address && (
          <div className="flex items-center justify-center gap-1.5 text-gray-500 text-sm">
            <MapPin size={14} className="flex-shrink-0" />
            <span>{store.address}</span>
          </div>
        )}
      </div>

      {/* タブナビ */}
      <div className="bg-white border-b border-gray-200 px-6 lg:px-10 sticky top-16 z-10 lg:max-w-3xl lg:mx-auto">
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
      <div className="px-6 lg:px-10 py-6 max-w-3xl mx-auto">
        {activeTab === 'info' && <InfoTab store={store} />}
        {activeTab === 'products' && <ProductsTab store={store} activeProducts={activeProducts} />}
        {activeTab === 'dogs' && <VisitingDogsTab />}
      </div>
    </div>
  )
}

// ── 基本情報タブ ──────────────────────────────────────────────────
function InfoTab({ store }: { store: Store }) {
  return (
    <div className="space-y-4">
      {/* 説明 */}
      {store.description && (
        <div className="bg-white rounded-xl p-5">
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{store.description}</p>
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-white rounded-xl p-5 space-y-2">
        {store.address && (
          <InfoRow icon={<MapPin size={16} />} label="住所" value={store.address} />
        )}
        {store.openHours && typeof store.openHours === 'string' && (
          <InfoRow icon={<Clock size={16} />} label="営業時間" value={store.openHours} />
        )}
        {store.openHours && typeof store.openHours === 'object' && (
          <InfoRow
            icon={<Clock size={16} />}
            label="営業時間"
            value={Object.entries(store.openHours as Record<string, string>)
              .map(([day, hours]) => `${day}: ${hours}`)
              .join('\n')}
          />
        )}
        {(store as Store & { holiday?: string }).holiday && (
          <InfoRow icon={<Clock size={16} />} label="定休日" value={(store as Store & { holiday?: string }).holiday!} />
        )}
        {store.phone && (
          <InfoRow icon={<Phone size={16} />} label="電話番号" value={store.phone} />
        )}
        {store.email && (
          <InfoRow icon={<Mail size={16} />} label="メール" value={store.email} />
        )}
      </div>

      {/* サービス内容・料金 */}
      {store.services && store.services.length > 0 && (
        <div className="bg-white rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">サービス内容・料金</h3>
          <div className="space-y-3">
            {store.services.map((service, i) => (
              <div key={service.id ?? i} className="border border-gray-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-800">{service.name}</p>
                {service.description && (
                  <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  {service.duration && (
                    <p className="text-xs text-gray-400">{service.duration}分</p>
                  )}
                  {service.price != null && (
                    <p className="text-sm font-bold text-orange-500">
                      ¥{service.price.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-gray-700">{value}</p>
      </div>
    </div>
  )
}

// ── 商品タブ ──────────────────────────────────────────────────────
function ProductsTab({ store, activeProducts }: { store: Store; activeProducts: StoreProduct[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {activeProducts.map((product) => (
        <Link key={product.productId} href={`/search/${store.id}/${product.productId}`}>
          <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-100 relative">
              {product.photos?.[0] ? (
                <Image src={product.photos[0]} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={28} className="text-gray-300" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
              {product.price != null && (
                <p className="text-orange-500 font-bold text-sm mt-0.5">
                  ¥{product.price.toLocaleString()}
                </p>
              )}
              {product.stock != null && product.stock <= 5 && (
                <p className="text-xs text-red-400 mt-0.5">残り{product.stock}点</p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── 来店犬タブ（大枠のみ・中身は今後実装） ────────────────────────────
function VisitingDogsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <p className="text-sm">来店した子の表示は現在準備中です。</p>
    </div>
  )
}

// ── ローディングスケルトン ────────────────────────────────────────
function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="aspect-video lg:aspect-[21/9] bg-gray-200 animate-pulse" />
      <div className="bg-white border-b border-gray-100 px-6 lg:px-10 py-5">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-7 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-4 w-16 bg-gray-200 rounded animate-pulse" />)}
        </div>
      </div>
    </div>
  )
}
