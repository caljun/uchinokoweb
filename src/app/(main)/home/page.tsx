'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy, doc, increment, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { ExternalLink, Tag } from 'lucide-react'

interface Recommendation {
  id: string
  title: string
  description?: string
  imageUrl?: string
  url: string
  category: string
  tapCount?: number
  isActive?: boolean
  order?: number
  targetAgeGroups?: number[] | null
  targetSizes?: number[] | null
  targetPetType?: 'dog' | 'cat' | null  // null または未設定 = 全ペット対象
}

const CATEGORY_LABELS: Record<string, string> = {
  cafe: 'ドッグカフェ',
  food: 'ドッグフード',
  grooming: 'トリミング',
  goods: 'グッズ',
  service: 'サービス',
  cat_food: 'キャットフード',
  cat_goods: '猫グッズ',
  cat_grooming: '猫用グルーミング',
  other: 'その他',
}

const DOG_AGE_LABELS: Record<number, string> = { 0: 'パピー', 1: '成犬', 2: 'シニア' }
const CAT_AGE_LABELS: Record<number, string> = { 0: '子猫', 1: '成猫', 2: 'シニア' }

const SIZE_LABELS: Record<number, string> = {
  0: '小型犬',
  1: '中型犬',
  2: '大型犬',
}

interface DogProfile {
  id: string
  name: string
  photoUrl?: string
  ageGroup: number | null
  breedSize: number | null
  petType?: 'dog' | 'cat'
}

function calcScore(item: Recommendation, ageGroup: number | null, breedSize: number | null): number {
  let score = 0
  if (ageGroup !== null) {
    if (!item.targetAgeGroups || item.targetAgeGroups.includes(ageGroup)) score += 50
  }
  if (breedSize !== null) {
    if (!item.targetSizes || item.targetSizes.includes(breedSize)) score += 50
  }
  return score
}

function sortByDogProfile(
  items: Recommendation[],
  ageGroup: number | null,
  breedSize: number | null,
): Recommendation[] {
  if (ageGroup === null && breedSize === null) return items
  return [...items].sort(
    (a, b) => calcScore(b, ageGroup, breedSize) - calcScore(a, ageGroup, breedSize),
  )
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const [dogs, setDogs] = useState<DogProfile[]>([])
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null)
  const [dogLoading, setDogLoading] = useState(false)
  const [allRecommendations, setAllRecommendations] = useState<Recommendation[]>([])

  useEffect(() => {
    if (!user) return
    setDogLoading(true)
    getDocs(query(collection(db, 'owners', user.uid, 'dogs')))
      .then((snap) => {
        const list: DogProfile[] = snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            name: data.name ?? 'うちの子',
            photoUrl: data.photos?.[0] ?? data.photoUrl ?? undefined,
            ageGroup: typeof data.ageGroup === 'number' ? data.ageGroup : null,
            breedSize: typeof data.breedSize === 'number' ? data.breedSize : null,
            petType: data.petType ?? 'dog',
          }
        })
        setDogs(list)
        if (list.length > 0) setSelectedDogId(list[0].id)
      })
      .catch(() => {})
      .finally(() => setDogLoading(false))
  }, [user])

  useEffect(() => {
    getDocs(query(collection(db, 'recommendations'), orderBy('order', 'asc')))
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Recommendation))
          .filter((r) => r.isActive !== false)
        setAllRecommendations(list)
      })
      .catch(() => {})
  }, [])

  const handleTap = (item: Recommendation) => {
    updateDoc(doc(db, 'recommendations', item.id), { tapCount: increment(1) }).catch(() => {})
  }

  const loading = authLoading || dogLoading

  const selectedDog = dogs.find((d) => d.id === selectedDogId) ?? null
  const petType = selectedDog?.petType ?? 'dog'
  const ageLabels = petType === 'cat' ? CAT_AGE_LABELS : DOG_AGE_LABELS
  const filteredRecommendations = allRecommendations.filter(
    (r) => !r.targetPetType || r.targetPetType === petType
  )
  const items = sortByDogProfile(filteredRecommendations, selectedDog?.ageGroup ?? null, selectedDog?.breedSize ?? null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 犬セレクター */}
      {!loading && dogs.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {dogs.map((dog) => (
              <button
                key={dog.id}
                onClick={() => setSelectedDogId(dog.id)}
                className={`flex flex-col items-center gap-1 shrink-0 transition-opacity ${
                  selectedDogId === dog.id ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-colors ${
                  selectedDogId === dog.id ? 'border-orange-400' : 'border-transparent'
                }`}>
                  {dog.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dog.photoUrl} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-orange-100 flex items-center justify-center text-lg">
                      {dog.petType === 'cat' ? '🐱' : '🐕'}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium max-w-[52px] truncate ${
                  selectedDogId === dog.id ? 'text-orange-500' : 'text-gray-400'
                }`}>{dog.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-3 pb-0 max-w-2xl mx-auto">
        <p className="text-xs text-gray-400">※このページにはアフィリエイトリンクが含まれます</p>
      </div>
      <div className="px-4 py-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="w-24 h-24 shrink-0 bg-gray-200" />
                <div className="flex-1 p-3 space-y-2">
                  <div className="h-3 w-1/3 bg-gray-200 rounded" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
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
          <div className="space-y-3">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleTap(item)}
                className="flex bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]"
              >
                <div className="w-24 h-24 shrink-0 bg-gray-100 overflow-hidden">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex gap-1.5 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    {item.targetAgeGroups?.map((ag) => (
                      <span key={ag} className="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        {ageLabels[ag]}
                      </span>
                    ))}
                    {item.targetSizes?.map((sz) => (
                      <span key={sz} className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {SIZE_LABELS[sz]}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-start justify-between gap-1">
                    <h2 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{item.title}</h2>
                    <ExternalLink size={14} className="text-gray-400 shrink-0 mt-0.5" />
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>
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
