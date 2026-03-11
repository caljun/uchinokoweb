'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, limit, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { ExternalLink, Tag } from 'lucide-react'
import { recommendations, type Recommendation } from '@/data/recommendations'

const CATEGORY_LABELS: Record<string, string> = {
  cafe: 'ドッグカフェ',
  food: 'ドッグフード',
  grooming: 'トリミング',
  goods: 'グッズ',
  service: 'サービス',
  other: 'その他',
}

const AGE_LABELS: Record<number, string> = {
  0: 'パピー向け',
  1: '成犬向け',
  2: 'シニア向け',
}

function sortByAgeGroup(items: Recommendation[], ageGroup: number | null): Recommendation[] {
  if (ageGroup === null) return items
  return [...items].sort((a, b) => {
    const aMatch = !a.targetAgeGroups || a.targetAgeGroups.includes(ageGroup) ? 0 : 1
    const bMatch = !b.targetAgeGroups || b.targetAgeGroups.includes(ageGroup) ? 0 : 1
    return aMatch - bMatch
  })
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const [dogAgeGroup, setDogAgeGroup] = useState<number | null>(null)
  const [dogLoading, setDogLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setDogLoading(true)
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), limit(1)))
      .then((snap) => {
        if (!snap.empty) {
          const data = snap.docs[0].data()
          const ag = data.ageGroup
          setDogAgeGroup(typeof ag === 'number' ? ag : null)
        }
      })
      .catch(() => {})
      .finally(() => setDogLoading(false))
  }, [user])

  const loading = authLoading || dogLoading

  const items = sortByAgeGroup(recommendations, dogAgeGroup)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <h1 className="text-xl font-bold text-gray-900">おすすめ</h1>
        <p className="text-sm text-gray-500 mt-0.5">愛犬のために選んだお店・商品・サービス</p>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  <div className="h-5 w-2/3 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
            <Tag size={40} strokeWidth={1.5} />
            <p className="text-sm">まだおすすめがありません</p>
            <p className="text-xs text-center">近日公開予定です</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]"
              >
                {item.imageUrl && (
                  <div className="relative h-44 bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex gap-2 mb-2">
                    <span className="inline-block text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    {item.targetAgeGroups?.map((ag) => (
                      <span key={ag} className="inline-block text-xs font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        {AGE_LABELS[ag]}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-bold text-gray-900 leading-snug">{item.title}</h2>
                    <ExternalLink size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
