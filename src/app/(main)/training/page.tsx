'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronRight } from 'lucide-react'

interface DogProfile {
  id: string
  name: string
  photoUrl?: string
  difficultyRank?: string
  petType?: 'dog' | 'cat'
}

const DIFFICULTY_SECTIONS = [
  {
    rank: 'A',
    label: 'しつけやすい',
    description: '覚えが早く、比較的スムーズにトレーニングできるタイプ',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    rank: 'B',
    label: 'ふつう',
    description: '根気よく続けることで着実に習得できるタイプ',
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-700',
  },
  {
    rank: 'C',
    label: 'しつけに工夫が必要',
    description: '個性が強く、アプローチを工夫することが大切なタイプ',
    color: 'bg-red-50 border-red-200',
    badgeColor: 'bg-red-100 text-red-700',
  },
]

export default function TrainingPage() {
  const { user } = useAuth()
  const [dogs, setDogs] = useState<DogProfile[]>([])
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        const list: DogProfile[] = snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            name: data.name ?? 'うちの子',
            photoUrl: data.photos?.[0] ?? data.photoUrl ?? undefined,
            difficultyRank: data.difficultyRank ?? undefined,
            petType: data.petType ?? 'dog',
          }
        })
        setDogs(list)
        if (list.length > 0) setSelectedDogId(list[0].id)
      })
      .catch(() => {})
  }, [user])

  const selectedDog = dogs.find((d) => d.id === selectedDogId) ?? null
  const rank = selectedDog?.difficultyRank

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* 犬セレクター */}
      {dogs.length > 1 && (
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

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* 難易度ヘッダー */}
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
          {selectedDog ? (
            rank ? (
              <div>
                <p className="text-sm text-gray-500 mb-1">{selectedDog.name}のしつけ難易度</p>
                <div className="flex items-center gap-3">
                  <span className={`text-3xl font-black px-4 py-1 rounded-xl ${
                    rank === 'A' ? 'bg-green-100 text-green-700' :
                    rank === 'B' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {rank}
                  </span>
                  <span className="text-lg font-semibold text-gray-800">
                    {DIFFICULTY_SECTIONS.find(s => s.rank === rank)?.label}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">診断を完了すると難易度が表示されます</p>
            )
          ) : (
            <p className="text-sm text-gray-400">読み込み中...</p>
          )}
        </div>

        {/* トレーニングコース */}
        <div className="flex flex-col gap-4">
          {DIFFICULTY_SECTIONS.map(({ rank: r, label, description, color, badgeColor }) => (
            <div
              key={r}
              className={`rounded-2xl border p-5 ${color} ${rank && rank !== r ? 'opacity-40' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                    難易度 {r}
                  </span>
                  <span className="font-semibold text-gray-800">{label}</span>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">{description}</p>
              <p className="text-xs text-gray-400 mt-3">準備中</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
