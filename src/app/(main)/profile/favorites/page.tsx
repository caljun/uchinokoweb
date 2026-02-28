'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Store } from '@/types/store'
import { Store as StoreIcon, Heart } from 'lucide-react'

export default function FavoritesPage() {
  const { user, owner } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!owner || !owner.favoriteStoreIds || owner.favoriteStoreIds.length === 0) {
        setStores([])
        setLoading(false)
        return
      }
      const favoriteIds = owner.favoriteStoreIds
      const snap = await getDocs(
        query(collection(db, 'shops'), where('__name__', 'in', favoriteIds.slice(0, 10)))
      )
      setStores(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Store)))
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [owner])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
        <p className="text-sm text-gray-500 mb-4">ログインするとお気に入りのお店を確認できます。</p>
        <Link
          href="/auth"
          className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
        >
          ログイン / 新規登録
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 lg:px-10 py-6">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Heart size={18} className="text-pink-500" />
          <span>お気に入りのお店</span>
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : stores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <StoreIcon size={40} strokeWidth={1.5} />
            <p className="text-sm">まだお気に入り登録されたお店がありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {stores.map((store) => (
              <Link key={store.id} href={`/search/${store.id}`}>
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
                    <p className="text-gray-400 text-xs truncate mt-0.5">
                      {store.categories?.[0] ?? store.address ?? ''}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

