'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Dog } from '@/types/dog'
import { Plus, PawPrint, ChevronRight } from 'lucide-react'

export default function UchinokoPage() {
  const { user } = useAuth()
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        setDogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dog)))
        setLoading(false)
      })
  }, [user])

  const AGE_LABELS = ['パピー期', '成犬期', 'シニア期']

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center py-20 px-5 gap-5">
          <PawPrint size={48} strokeWidth={1.5} className="text-gray-300" />
          <p className="text-gray-500 text-center">ログインするとうちの子を登録できます</p>
          <Link href="/auth" className="w-full max-w-xs">
            <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold">
              ログイン / 新規登録
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 lg:px-10 py-6">
        <div className="flex justify-end mb-4">
          <Link href="/uchinoko/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
              <Plus size={16} />
              <span>登録する</span>
            </button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : dogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
            <PawPrint size={48} strokeWidth={1.5} />
            <p className="text-gray-500 text-center">まだうちの子が登録されていません</p>
            <Link href="/uchinoko/new">
              <button className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors text-sm">
                最初の子を登録する
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dogs.map((dog) => (
              <Link key={dog.id} href={`/uchinoko/${dog.id}`}>
                <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-[3/4] bg-orange-50 relative">
                    {dog.photoUrl ? (
                      <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PawPrint size={36} className="text-orange-200" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800 text-sm truncate">{dog.name}</p>
                      <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {AGE_LABELS[dog.ageGroup] ?? '成犬期'} ・ {dog.gender === 'male' ? 'オス' : 'メス'}
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
