'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Dog, Diary, HealthRecord } from '@/types/dog'
import { ArrowLeft, BookOpen, Heart } from 'lucide-react'
import { getBreedDescription, getAgeDisplayText, BreedInfo } from '@/lib/diagnosis'

type Tab = 'detail' | 'diary' | 'health'

const TEMPERAMENT_DESCRIPTIONS: Record<string, string> = {
  リーダータイプ: '知恵があり勇敢なまとめ役タイプ。人の役に立ちたいと思っています。',
  右腕タイプ: '活発で楽観的、好奇心旺盛なタイプ。運動と刺激をしっかり与えると輝きます。',
  市民タイプ: '社交性があり比較的飼いやすいタイプ。遊びを通して楽しむのが得意です。',
  守られタイプ: '特定の人になつきやすく、甘えん坊なタイプ。安心できる環境が大切です。',
}

const CONDITION_COLORS: Record<string, string> = {
  '元気': 'text-green-600 bg-green-50',
  '普通': 'text-blue-600 bg-blue-50',
  'ちょっと心配': 'text-orange-600 bg-orange-50',
  'しんどい': 'text-red-600 bg-red-50',
}

function toDate(v: unknown): Date | null {
  if (!v) return null
  if (typeof (v as { toDate?: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate()
  }
  const d = new Date(v as string)
  return isNaN(d.getTime()) ? null : d
}

export default function PublicDogProfilePage() {
  const { ownerId, dogId } = useParams<{ ownerId: string; dogId: string }>()
  const router = useRouter()
  const [dog, setDog] = useState<Dog | null>(null)
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('detail')

  useEffect(() => {
    if (!ownerId || !dogId) return
    const load = async () => {
      const snap = await getDoc(doc(db, 'owners', ownerId, 'dogs', dogId))
      if (!snap.exists()) { setNotFound(true); setLoading(false); return }
      const data = { id: snap.id, ...snap.data() } as Dog
      if (!data.isPublic) { setNotFound(true); setLoading(false); return }
      setDog(data)

      await Promise.allSettled([
        getDocs(query(collection(db, 'owners', ownerId, 'dogs', dogId, 'diaries'), orderBy('createdAt', 'desc')))
          .then(s => setDiaries(s.docs.map(d => ({ id: d.id, ...d.data() } as Diary)))),
        getDocs(query(collection(db, 'owners', ownerId, 'dogs', dogId, 'healthRecords'), orderBy('recordDate', 'desc')))
          .then(s => setHealthRecords(s.docs.map(d => ({ id: d.id, ...d.data() } as HealthRecord)))),
      ])
      setLoading(false)
    }
    load().catch(() => { setNotFound(true); setLoading(false) })
  }, [ownerId, dogId])

  if (loading) return <DogSkeleton />

  if (notFound || !dog) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 text-gray-400">
        <p className="text-sm">この子のプロフィールは公開されていません</p>
        <button onClick={() => router.back()} className="text-sm text-orange-500 hover:underline">戻る</button>
      </div>
    )
  }

  const ageText = dog.birthDate ? getAgeDisplayText(dog.birthDate) : null
  const breedInfo: BreedInfo | null = dog.breed ? getBreedDescription(dog.breed) : null
  const tempDesc = dog.temperamentType ? TEMPERAMENT_DESCRIPTIONS[dog.temperamentType] : null

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900">{dog.name}</h1>
      </div>

      {/* タブ */}
      <div className="bg-white border-b border-gray-200 px-6 sticky top-16 z-10">
        <div className="flex justify-center gap-12">
          {([
            { key: 'detail' as Tab, label: '詳細' },
            { key: 'diary' as Tab, label: '日記' },
            { key: 'health' as Tab, label: '健康' },
          ]).map(({ key, label }) => (
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

      <div className="pb-8">

        {/* ── 詳細タブ ── */}
        {activeTab === 'detail' && (
          <>
            {/* 写真 - フル幅 */}
            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
              {dog.photoUrl ? (
                <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">🐶</div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-5 pt-12">
                <p className="text-white text-2xl font-bold">{dog.name}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {dog.breed && <span className="text-white/90 text-xs">{dog.breed}</span>}
                  {ageText && <span className="text-white/70 text-xs">· {ageText}</span>}
                  {dog.gender && <span className="text-white/70 text-xs">· {dog.gender}</span>}
                </div>
              </div>
            </div>

            <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">
            <div className="bg-white rounded-2xl p-5">
              <p className="text-xs text-gray-400 font-medium mb-3">基本情報</p>
              <div className="grid grid-cols-2 gap-y-3">
                {dog.breed && (
                  <div><p className="text-xs text-gray-400">犬種</p><p className="text-sm font-medium text-gray-800 mt-0.5">{dog.breed}</p></div>
                )}
                {ageText && (
                  <div><p className="text-xs text-gray-400">年齢</p><p className="text-sm font-medium text-gray-800 mt-0.5">{ageText}</p></div>
                )}
                {dog.gender && (
                  <div><p className="text-xs text-gray-400">性別</p><p className="text-sm font-medium text-gray-800 mt-0.5">{dog.gender}</p></div>
                )}
                {dog.weight != null && (
                  <div><p className="text-xs text-gray-400">体重</p><p className="text-sm font-medium text-gray-800 mt-0.5">{dog.weight} kg</p></div>
                )}
              </div>
            </div>

            {dog.temperamentType && (
              <div className="bg-white rounded-2xl p-5">
                <p className="text-xs text-gray-400 font-medium mb-2">性格タイプ</p>
                <p className="text-base font-bold text-gray-900 mb-2">{dog.temperamentType}</p>
                {tempDesc && <p className="text-sm text-gray-500 leading-relaxed">{tempDesc}</p>}
                {dog.difficultyRank && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-400">しつけ難易度</span>
                    <span className="text-sm font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{dog.difficultyRank}ランク</span>
                  </div>
                )}
              </div>
            )}

            {breedInfo && (
              <div className="bg-white rounded-2xl p-5 space-y-3">
                <p className="text-xs text-gray-400 font-medium">犬種詳細</p>
                {breedInfo.origin && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">原産地</span>
                    <span className="text-gray-800 font-medium">{breedInfo.origin}</span>
                  </div>
                )}
                {breedInfo.purpose && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">用途</span>
                    <span className="text-gray-800 font-medium text-right max-w-[60%]">{breedInfo.purpose}</span>
                  </div>
                )}
                {breedInfo.pros && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">長所</span>
                    <span className="text-green-600 font-medium">{breedInfo.pros}</span>
                  </div>
                )}
                {breedInfo.cons && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">注意点</span>
                    <span className="text-orange-500 font-medium">{breedInfo.cons}</span>
                  </div>
                )}
                {breedInfo.chip && (
                  <p className="text-sm text-gray-500 leading-relaxed pt-2 border-t border-gray-100">{breedInfo.chip}</p>
                )}
              </div>
            )}

            {dog.difficultyDescription && (
              <div className="bg-white rounded-2xl p-5">
                <p className="text-xs text-gray-400 font-medium mb-2">しつけについて</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{dog.difficultyDescription}</p>
              </div>
            )}
            </div>{/* /px-5 */}
          </>
        )}

        {/* ── 日記タブ（2列 3:4グリッド） ── */}
        {activeTab === 'diary' && (
          diaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <BookOpen size={36} strokeWidth={1.5} />
              <p className="text-sm">日記はまだありません</p>
            </div>
          ) : (
            <div className="max-w-lg mx-auto px-5 pt-5 grid grid-cols-2 gap-3">
              {diaries.map((diary) => {
                const date = toDate(diary.createdAt)
                const photo = diary.photos?.[0]
                return (
                  <div key={diary.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                    {photo ? (
                      <Image src={photo} alt="日記" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl bg-orange-50">📝</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      {date && (
                        <p className="text-white/70 text-[10px] mb-1">
                          {date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                        </p>
                      )}
                      {diary.comment && (
                        <p className="text-white text-xs leading-tight line-clamp-2">{diary.comment}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ── 健康タブ ── */}
        {activeTab === 'health' && (
          healthRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Heart size={36} strokeWidth={1.5} />
              <p className="text-sm">健康記録はまだありません</p>
            </div>
          ) : (
            <div className="max-w-lg mx-auto px-5 pt-5 space-y-3">
              {healthRecords.map((rec) => {
                const date = toDate(rec.recordDate)
                return (
                  <div key={rec.id} className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      {date && (
                        <p className="text-sm font-medium text-gray-800">
                          {date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                      {rec.condition && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_COLORS[rec.condition] ?? 'text-gray-500 bg-gray-100'}`}>
                          {rec.condition}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      {rec.weight != null && <span>体重 <strong>{rec.weight} kg</strong></span>}
                      {rec.appetite && <span>食欲 <strong>{rec.appetite}</strong></span>}
                    </div>
                    {rec.note && (
                      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{rec.note}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

      </div>
    </div>
  )
}

function DogSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-5 py-3 h-14" />
      <div className="aspect-[3/4] max-h-[480px] bg-gray-200 animate-pulse" />
      <div className="max-w-lg mx-auto px-5 py-5 space-y-4">
        <div className="bg-white rounded-2xl p-5 space-y-3">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
          </div>
        </div>
      </div>
    </div>
  )
}
