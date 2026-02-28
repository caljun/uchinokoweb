'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, getDocs, limit, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Store, StoreProduct } from '@/types/store'
import { Package, ArrowLeft } from 'lucide-react'
import { ProductCard } from '@/components/home/HomeCards'

type ProductWithStore = { product: StoreProduct; store: Store }

export default function HomeProductsPage() {
  const [products, setProducts] = useState<ProductWithStore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'shops'), where('isPublished', '==', true), limit(50)))
      .then((snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Store))
        const flat: ProductWithStore[] = []
        data.forEach((store) => {
          store.products?.forEach((p) => {
            if (p.productId && p.isActive !== false && !p.soldOut) {
              flat.push({ product: p, store })
            }
          })
        })
        setProducts(flat)
        setLoading(false)
      })
  }, [])

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
          <h1 className="text-xl font-bold text-gray-900">商品</h1>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
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
              {products.map(({ product, store }) => (
                <div key={`${store.id}-${product.productId}`}>
                  <Link
                    href={`/search/${store.id}/${product.productId}`}
                    className="lg:hidden block"
                  >
                    <ProductCard product={product} store={store} />
                  </Link>
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
        </div>
      </div>
    </div>
  )
}
