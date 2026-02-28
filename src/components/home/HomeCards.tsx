'use client'

import Image from 'next/image'
import { Store, StoreProduct } from '@/types/store'
import { Package, Store as StoreIcon, Heart, Star } from 'lucide-react'

export function ProductCard({ product, store }: { product: StoreProduct; store: Store }) {
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

export function StoreCard({
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
      <div className="aspect-video bg-gray-100 relative">
        {store.photoUrls?.[0] ? (
          <Image src={store.photoUrls[0]} alt={store.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <StoreIcon size={32} className="text-gray-300" strokeWidth={1.5} />
          </div>
        )}
      </div>
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
