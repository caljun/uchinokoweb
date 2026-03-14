'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Dog, Diary } from '@/types/dog'
import { Pencil, Share2, Target, UserPlus } from 'lucide-react'
import { ShareCardsModal } from '@/components/share/ShareCardsModal'
import { getBreedDescription, getAgeDisplayText, getCatAgeDisplayText } from '@/lib/diagnosis'

type Tab = 'info' | 'gallery'

const TEMPERAMENT_DESCRIPTIONS: Record<string, string> = {
  リーダータイプ:
    '知恵があり勇敢なまとめ役タイプです。\n犬社会と人間社会での自分の役割を理解しており、人の役に立ちたいと思っています。\n仕事を与えて達成感を味わわせてあげましょう。',
  右腕タイプ:
    '活発で楽観的、好奇心旺盛なタイプです。\n目立つ失敗をすることもありますが、リーダータイプの犬や人のもとで能力が向上します。\n運動と刺激をしっかり与えてあげましょう。',
  市民タイプ:
    '遊びを通して序列確認をし合って過ごすタイプです。\n遊びがヒートアップしてケンカになりやすいですが、社交性があり比較的飼いやすいです。\n適度な遊び相手を見つけてあげましょう。',
  守られタイプ:
    '特定の人になつきやすく、その他の人には人見知りをするタイプです。\nいつも抱っこされていたいと思っています。\n環境の変化は苦手なので、社会化を意識して取り組みましょう。',
}


export default function UchinokoDetailPage() {
  const { dogId } = useParams<{ dogId: string }>()
  const { user, owner } = useAuth()
  const router = useRouter()
  const [dog, setDog] = useState<Dog | null>(null)
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [detailSlide, setDetailSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; comment?: string; createdAt?: unknown } | null>(null)
  const touchStartX = useRef<number | null>(null)

  const handleInvite = async () => {
    if (!owner?.friendId || !dog) return
    const url = `${window.location.origin}/auth?ref=${owner.friendId}&for=${dogId}`
    const title = `${dog.name}と一緒にウチの子やろう🐾`
    const text = `${dog.name}が待ってるよ🐾 一緒にウチの子はじめよう！`

    if (dog.photoUrl && navigator.share) {
      try {
        const res = await fetch(dog.photoUrl)
        const blob = await res.blob()
        const file = new File([blob], `${dog.name}.jpg`, { type: blob.type })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ title, text, url, files: [file] })
          return
        }
      } catch {}
    }

    if (navigator.share) {
      await navigator.share({ title, text, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  useEffect(() => {
    if (!user || !dogId) return
    const fetchAll = async () => {
      const dogSnap = await getDoc(doc(db, 'owners', user.uid, 'dogs', dogId))
      if (!dogSnap.exists()) { router.push('/uchinoko'); return }
      setDog({ id: dogSnap.id, ...dogSnap.data() } as Dog)

      const diarySnap = await getDocs(query(collection(db, 'owners', user.uid, 'dogs', dogId, 'diaries'), orderBy('createdAt', 'desc')))
      setDiaries(diarySnap.docs.map((d) => ({ id: d.id, ...d.data() } as Diary)))
      setLoading(false)
    }
    fetchAll()
  }, [user, dogId, router])

  if (loading) return <Loading />
  if (!dog) return null

  const isCat = dog.petType === 'cat'
  const slideCount = isCat ? 2 : 3
  const petEmoji = isCat ? '🐱' : '🐾'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {/* タブ */}
        <div className="bg-white border-b border-gray-100 mt-2">
          <div className="px-5 flex">
            {(['info', 'gallery'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-orange-400 text-orange-500' : 'border-transparent text-gray-400'
                }`}
              >
                {t === 'info' ? '詳細' : 'ギャラリー'}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4">
          {/* 詳細タブ */}
          {tab === 'info' && (
            <div className="space-y-4">
              {/* 編集 / シェアボタン */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Share2 size={14} />
                  シェア
                </button>
                <button
                  onClick={handleInvite}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  <UserPlus size={14} />
                  招待
                </button>
                <Link
                  href={`/uchinoko/${dogId}/edit`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-500 border border-orange-200 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors"
                >
                  <Pencil size={14} />
                  編集
                </Link>
              </div>

              {/* スライド */}
              <div
                className="relative max-w-md mx-auto overflow-hidden"
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
                onTouchEnd={(e) => {
                  if (touchStartX.current === null) return
                  const diff = touchStartX.current - e.changedTouches[0].clientX
                  if (Math.abs(diff) > 40) {
                    setDetailSlide((prev) =>
                      diff > 0
                        ? (prev === slideCount - 1 ? 0 : prev + 1)
                        : (prev === 0 ? slideCount - 1 : prev - 1)
                    )
                  }
                  touchStartX.current = null
                }}
              >
                <div
                  className="flex transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${detailSlide * 100}%)` }}
                >
                  {/* 1枚目: 写真（3:4） */}
                  <div className="w-full shrink-0">
                    <div className="w-full aspect-[3/4] bg-orange-100 rounded-2xl overflow-hidden relative">
                      {dog.photoUrl ? (
                        <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">{petEmoji}</div>
                      )}
                    </div>
                  </div>

                  {/* 2枚目: 基本情報（犬・猫共通） */}
                  <div className="w-full shrink-0 px-1">
                    <div className="space-y-4">
                      <SummaryCard dog={dog} />
                      {!isCat && (
                        <InfoCard title="犬のタイプ">
                          <p className="text-xs text-gray-400 mb-1">性格タイプ</p>
                          <p className="text-base font-semibold text-gray-800">{dog.temperamentType}</p>
                          {TEMPERAMENT_DESCRIPTIONS[dog.temperamentType] && (
                            <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">
                              {TEMPERAMENT_DESCRIPTIONS[dog.temperamentType]}
                            </p>
                          )}
                        </InfoCard>
                      )}
                    </div>
                  </div>

                  {/* 3枚目: 犬種の特徴（犬のみ） */}
                  {!isCat && (
                    <div className="w-full shrink-0 px-1">
                      <div className="space-y-4 max-h-[450px] overflow-y-auto lg:max-h-none lg:overflow-visible">
                        <InfoCard title="犬種の特徴">
                          {(() => {
                            const info = getBreedDescription(dog.breed)
                            const hasContent = info.origin || info.purpose || info.pros || info.cons || info.chip
                            if (!hasContent) {
                              return <p className="text-sm text-gray-400">この犬種の特徴は準備中です。</p>
                            }
                            return (
                              <div className="space-y-1 text-sm text-gray-700">
                                <p className="font-semibold">【{dog.breed}の特徴】</p>
                                {info.origin && <p className="text-gray-500">原産国: {info.origin}</p>}
                                {info.purpose && <p className="text-gray-500">目的: {info.purpose}</p>}
                                {info.pros && <p className="text-gray-500">長所: {info.pros}</p>}
                                {info.cons && <p className="text-gray-500">短所: {info.cons}</p>}
                                {info.chip && <p className="text-gray-500 mt-1 whitespace-pre-line">{info.chip}</p>}
                              </div>
                            )
                          })()}
                        </InfoCard>

                        <InfoCard title="詳細説明">
                          {dog.difficultyDescription ? (
                            <div className="space-y-3 text-sm text-gray-500">
                              {dog.difficultyDescription
                                .split('\n\n')
                                .map((paragraph, idx) => (
                                  <p key={idx} className="leading-relaxed">
                                    {paragraph.replace(/\n/g, '')}
                                  </p>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">まだ詳細説明はありません。</p>
                          )}
                        </InfoCard>
                      </div>
                    </div>
                  )}
                </div>

                {/* スライド操作 */}
                <div className="absolute inset-y-1/2 left-0 right-0 flex items-center justify-between px-1 pointer-events-none">
                  <button
                    type="button"
                    onClick={() => setDetailSlide((prev) => (prev === 0 ? slideCount - 1 : prev - 1))}
                    className="w-8 h-8 rounded-full bg-white/80 text-gray-600 flex items-center justify-center shadow pointer-events-auto"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailSlide((prev) => (prev === slideCount - 1 ? 0 : prev + 1))}
                    className="w-8 h-8 rounded-full bg-white/80 text-gray-600 flex items-center justify-center shadow pointer-events-auto"
                  >
                    ›
                  </button>
                </div>

                {/* ドットインジケータ */}
                <div className="mt-3 flex justify-center gap-2">
                  {Array.from({ length: slideCount }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDetailSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full ${detailSlide === i ? 'bg-orange-500' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ギャラリータブ */}
          {tab === 'gallery' && (
            <div>
              {(() => {
                const allPhotos = diaries.flatMap((d) =>
                  (d.photos ?? []).map((url) => ({ url, comment: d.comment, createdAt: d.createdAt }))
                ).filter((p) => p.url)

                if (allPhotos.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-400">
                      <span className="text-5xl">📸</span>
                      <p className="text-sm font-medium text-gray-500">まだ写真がありません</p>
                      <Link
                        href="/missions"
                        className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl"
                      >
                        <Target size={16} />
                        ミッションをクリアしよう
                      </Link>
                    </div>
                  )
                }

                return (
                  <div className="grid grid-cols-2 gap-1">
                    {allPhotos.map((photo, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                        className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden"
                      >
                        <Image src={photo.url} alt={`photo ${i}`} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

        </div>

        {/* 写真詳細モーダル */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white text-xl"
            >
              ×
            </button>
            <div className="flex-1 relative" onClick={() => setSelectedPhoto(null)}>
              <Image src={selectedPhoto.url} alt="" fill className="object-contain" sizes="100vw" />
            </div>
            <div className="px-5 py-4 bg-black/80">
              {(() => {
                const raw = selectedPhoto.createdAt
                const date = raw instanceof Date ? raw : (raw as { toDate?: () => Date })?.toDate?.()
                return date ? (
                  <p className="text-xs text-gray-400 mb-1">{date.toLocaleDateString('ja-JP')}</p>
                ) : null
              })()}
              {selectedPhoto.comment && (
                <p className="text-white text-sm">{selectedPhoto.comment}</p>
              )}
            </div>
          </div>
        )}

        {/* シェアカードモーダル */}
        {showShareModal && (
          <ShareCardsModal dog={dog} onClose={() => setShowShareModal(false)} />
        )}


      </div>
    </div>
  )
}

// ===== 小コンポーネント =====
function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-sm font-bold text-gray-700 mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SummaryCard({ dog }: { dog: Dog }) {
  const isCat = dog.petType === 'cat'
  const ageLabel = isCat
    ? getCatAgeDisplayText(dog.birthDate)
    : getAgeDisplayText(dog.birthDate, dog.breedSize)
  const genderLabel = dog.gender === 'male' ? 'オス' : 'メス'
  const neuteredLabel = dog.neutered ? `${genderLabel}（去勢・避妊済み）` : genderLabel

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="mb-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-900 truncate">{dog.name}</h2>
          <span className="text-xs text-gray-400">基本情報</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SummaryTile label="年齢" icon="📅" value={ageLabel} />
        <SummaryTile label="性別" icon="⚥" value={neuteredLabel} />
        <SummaryTile label="体重" icon="⚖️" value={`${dog.weight}kg`} />
        {isCat ? (
          <SummaryTile label="毛色・柄" icon="🐱" value={dog.coatPattern ?? dog.breed} />
        ) : (
          <SummaryTile label="犬種" icon="🐶" value={dog.breed} />
        )}
      </div>
    </div>
  )
}

function SummaryTile({ label, icon, value }: { label: string; icon: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800 break-words">{value}</p>
    </div>
  )
}

