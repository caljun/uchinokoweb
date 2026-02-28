'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Dog, Diary, HealthRecord } from '@/types/dog'
import { Pencil, Share2 } from 'lucide-react'
import { ShareCardsModal } from '@/components/share/ShareCardsModal'

type Tab = 'info' | 'diary' | 'health'

const AGE_LABELS = ['パピー期', '成犬期', 'シニア期']
const SIZE_LABELS = ['小型犬', '中型犬', '大型犬']
const CONDITIONS = ['元気', '普通', 'ちょっと心配', 'しんどい']
const APPETITES = ['よく食べた', '普通', 'あまり食べなかった']
const CONDITION_COLORS: Record<string, string> = {
  '元気': 'text-green-600 bg-green-50',
  '普通': 'text-blue-600 bg-blue-50',
  'ちょっと心配': 'text-orange-600 bg-orange-50',
  'しんどい': 'text-red-600 bg-red-50',
}

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

function getTemperamentDescription(type: string): string {
  return TEMPERAMENT_DESCRIPTIONS[type] ?? ''
}

type BreedInfo = {
  origin: string
  purpose: string
  pros: string
  cons: string
  chip: string
}

const BREED_DESCRIPTIONS: Record<string, BreedInfo> = {
  柴犬: {
    origin: '日本',
    purpose: '狩猟 / 番犬',
    pros: '忠実 / 勇敢',
    cons: '独立心 / 抜け毛',
    chip: '日本を代表する犬。換毛期ブラッシングを。',
  },
}

function getBreedDescription(breed: string): BreedInfo {
  return BREED_DESCRIPTIONS[breed] ?? { origin: '', purpose: '', pros: '', cons: '', chip: '' }
}

export default function UchinokoDetailPage() {
  const { dogId } = useParams<{ dogId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [dog, setDog] = useState<Dog | null>(null)
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [detailSlide, setDetailSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showDiaryModal, setShowDiaryModal] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    if (!user || !dogId) return
    const fetchAll = async () => {
      const dogSnap = await getDoc(doc(db, 'owners', user.uid, 'dogs', dogId))
      if (!dogSnap.exists()) { router.push('/uchinoko'); return }
      setDog({ id: dogSnap.id, ...dogSnap.data() } as Dog)

      const [diarySnap, healthSnap] = await Promise.all([
        getDocs(query(collection(db, 'owners', user.uid, 'dogs', dogId, 'diaries'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'owners', user.uid, 'dogs', dogId, 'healthRecords'), orderBy('recordDate', 'desc'))),
      ])
      setDiaries(diarySnap.docs.map((d) => ({ id: d.id, ...d.data() } as Diary)))
      setHealthRecords(healthSnap.docs.map((d) => ({ id: d.id, ...d.data() } as HealthRecord)))
      setLoading(false)
    }
    fetchAll()
  }, [user, dogId, router])

  if (loading) return <Loading />
  if (!dog) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto">
        {/* タブ */}
        <div className="bg-white border-b border-gray-100 mt-2">
          <div className="px-5 flex">
            {(['info', 'diary', 'health'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-orange-400 text-orange-500' : 'border-transparent text-gray-400'
                }`}
              >
                {t === 'info' ? '詳細' : t === 'diary' ? '日記' : '健康'}
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
                <Link
                  href={`/uchinoko/${dogId}/edit`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 text-orange-500 border border-orange-200 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors"
                >
                  <Pencil size={14} />
                  編集
                </Link>
              </div>

              {/* スライド（3枚） */}
              <div className="relative max-w-md mx-auto overflow-hidden">
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
                        <div className="w-full h-full flex items-center justify-center text-6xl">🐾</div>
                      )}
                    </div>
                  </div>

                  {/* 2枚目: 基本情報 + 犬のタイプ */}
                  <div className="w-full shrink-0 px-1">
                    <div className="space-y-4">
                      <SummaryCard dog={dog} />
                      <InfoCard title="犬のタイプ">
                        <p className="text-xs text-gray-400 mb-1">性格タイプ</p>
                        <p className="text-base font-semibold text-gray-800">{dog.temperamentType}</p>
                        {getTemperamentDescription(dog.temperamentType) && (
                          <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">
                            {getTemperamentDescription(dog.temperamentType)}
                          </p>
                        )}
                      </InfoCard>
                    </div>
                  </div>

                  {/* 3枚目: 犬の特徴 + 詳細説明 */}
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
                </div>

                {/* スライド操作 */}
                <div className="absolute inset-y-1/2 left-0 right-0 flex items-center justify-between px-1 pointer-events-none">
                  <button
                    type="button"
                    onClick={() => setDetailSlide((prev) => (prev === 0 ? 2 : prev - 1))}
                    className="w-8 h-8 rounded-full bg-white/80 text-gray-600 flex items-center justify-center shadow pointer-events-auto"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailSlide((prev) => (prev === 2 ? 0 : prev + 1))}
                    className="w-8 h-8 rounded-full bg-white/80 text-gray-600 flex items-center justify-center shadow pointer-events-auto"
                  >
                    ›
                  </button>
                </div>

                {/* ドットインジケータ */}
                <div className="mt-3 flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDetailSlide(i)}
                      className={`w-2.5 h-2.5 rounded-full ${
                        detailSlide === i ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 日記タブ */}
          {tab === 'diary' && (
            <div>
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setShowDiaryModal(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold"
                >
                  + 日記を書く
                </button>
              </div>
              {diaries.length === 0 ? (
                <EmptyState emoji="📔" text="まだ日記がありません" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {diaries.map((diary) => (
                    <Link key={diary.id} href={`/uchinoko/${dogId}/diary/${diary.id}`}>
                      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <div className="w-full h-28 bg-gray-100 relative">
                          {diary.photos?.[0] ? (
                            <Image src={diary.photos[0]} alt="diary" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl">📔</div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-500 line-clamp-2">{diary.comment}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 健康記録タブ */}
          {tab === 'health' && (
            <div>
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setShowHealthModal(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold"
                >
                  + 記録を追加
                </button>
              </div>
              {healthRecords.length === 0 ? (
                <EmptyState emoji="🏥" text="まだ健康記録がありません" />
              ) : (
                <div className="space-y-3">
                  {healthRecords.map((record) => {
                    const date = record.recordDate instanceof Date
                      ? record.recordDate
                      : (record.recordDate as { toDate?: () => Date })?.toDate?.() ?? new Date()
                    return (
                      <div key={record.id} className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-gray-700">
                            {date.toLocaleDateString('ja-JP')}
                          </p>
                          {record.condition && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_COLORS[record.condition] ?? ''}`}>
                              {record.condition}
                            </span>
                          )}
                        </div>
                        {record.weight && <p className="text-sm text-gray-500">体重: {record.weight}kg</p>}
                        {record.appetite && <p className="text-sm text-gray-500">食欲: {record.appetite}</p>}
                        {record.note && <p className="text-sm text-gray-500 mt-1">{record.note}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 日記追加モーダル */}
        {showDiaryModal && user && dogId && (
          <DiaryModal
            ownerId={user.uid}
            dogId={dogId}
            onClose={() => setShowDiaryModal(false)}
            onCreated={(diary) => setDiaries((prev) => [diary, ...prev])}
          />
        )}

        {/* シェアカードモーダル */}
        {showShareModal && (
          <ShareCardsModal dog={dog} onClose={() => setShowShareModal(false)} />
        )}

        {/* 健康記録追加モーダル */}
        {showHealthModal && user && dogId && (
          <HealthModal
            ownerId={user.uid}
            dogId={dogId}
            onClose={() => setShowHealthModal(false)}
            onCreated={(record) => setHealthRecords((prev) => [record, ...prev])}
          />
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

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[color] ?? colors.gray}`}>
      {children}
    </span>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  )
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-5xl">{emoji}</span>
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  )
}

function SummaryCard({ dog }: { dog: Dog }) {
  const ageLabel = AGE_LABELS[dog.ageGroup] ?? '成犬期'
  const genderLabel = dog.gender === 'male' ? 'オス' : 'メス'
  const neuteredLabel = dog.neutered ? `${genderLabel}（去勢・避妊済み）` : genderLabel

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {/* 名前 */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-900 truncate">{dog.name}</h2>
          <span className="text-xs text-gray-400">基本情報</span>
        </div>
      </div>

      {/* 基本ステータス（2x2 グリッド） */}
      <div className="grid grid-cols-2 gap-3">
        <SummaryTile label="年齢" icon="📅" value={ageLabel} />
        <SummaryTile label="性別" icon="⚥" value={neuteredLabel} />
        <SummaryTile label="体重" icon="⚖️" value={`${dog.weight}kg`} />
        <SummaryTile label="犬種" icon="🐶" value={dog.breed} />
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

// ===== モーダルコンポーネント =====
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
          >
            ×
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  )
}

type DiaryModalProps = {
  ownerId: string
  dogId: string
  onClose: () => void
  onCreated: (diary: Diary) => void
}

function DiaryModal({ ownerId, dogId, onClose, onCreated }: DiaryModalProps) {
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const remaining = 3 - photos.length
    const newFiles = files.slice(0, remaining)
    setPhotos((prev) => [...prev, ...newFiles])
    setPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))])
  }

  const removePhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    if (!comment.trim()) return
    setSaving(true)
    try {
      const docRef = await addDoc(
        collection(db, 'owners', ownerId, 'dogs', dogId, 'diaries'),
        {
          dogId,
          ownerId,
          comment,
          photos: [],
          createdAt: serverTimestamp(),
        }
      )

      // 写真アップロード（最大3枚）
      const uploadedUrls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const storageRef = ref(
          storage,
          `owners/${ownerId}/dogs/${dogId}/diaries/${docRef.id}/photo_${i}.jpg`
        )
        await uploadBytes(storageRef, photos[i])
        const url = await getDownloadURL(storageRef)
        uploadedUrls.push(url)
      }

      // Firestore の photos を更新
      if (uploadedUrls.length > 0) {
        const { doc, updateDoc } = await import('firebase/firestore')
        await updateDoc(doc(db, 'owners', ownerId, 'dogs', dogId, 'diaries', docRef.id), {
          photos: uploadedUrls,
        })
      }

      onCreated({
        id: docRef.id,
        dogId,
        ownerId,
        comment,
        photos: uploadedUrls,
        createdAt: new Date(),
      } as Diary)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-base font-bold text-gray-800 mb-4">日記を書く</h2>
      {/* 写真 */}
      <div className="mb-5">
        <p className="text-sm font-medium text-gray-700 mb-2">写真（最大3枚）</p>
        <div className="flex gap-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative w-24 h-24">
              <Image src={src} alt={`photo ${i}`} fill className="object-cover rounded-xl" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400"
            >
              <span className="text-2xl">+</span>
              <span className="text-xs">追加</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoAdd}
          />
        </div>
      </div>

      {/* コメント */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">コメント *</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 100))}
          placeholder="今日のうちの子の様子を書いてね..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/100</p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !comment.trim()}
        className="w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-40"
      >
        {saving ? '保存中...' : '保存する'}
      </button>
    </ModalShell>
  )
}

type HealthModalProps = {
  ownerId: string
  dogId: string
  onClose: () => void
  onCreated: (record: HealthRecord) => void
}

function HealthModal({ ownerId, dogId, onClose, onCreated }: HealthModalProps) {
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [condition, setCondition] = useState('')
  const [appetite, setAppetite] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const docRef = await addDoc(
        collection(db, 'owners', ownerId, 'dogs', dogId, 'healthRecords'),
        {
          dogId,
          ownerId,
          recordDate: new Date(recordDate),
          weight: weight ? parseFloat(weight) : null,
          condition: condition || null,
          appetite: appetite || null,
          note: note || null,
          createdAt: serverTimestamp(),
        }
      )

      onCreated({
        id: docRef.id,
        dogId,
        ownerId,
        recordDate: new Date(recordDate),
        weight: weight ? parseFloat(weight) : null,
        condition: condition || null,
        appetite: appetite || null,
        note: note || null,
        createdAt: new Date(),
      } as HealthRecord)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-base font-bold text-gray-800 mb-4">健康記録を追加</h2>

      <div className="space-y-4">
        {/* 記録日 */}
        <Field label="記録日">
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm"
          />
        </Field>

        {/* 体重 */}
        <Field label="体重 (kg)（任意）">
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="例: 3.5"
            step="0.1"
            min="0"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm"
          />
        </Field>

        {/* 体調 */}
        <Field label="体調">
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                onClick={() => setCondition(condition === c ? '' : c)}
                className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  condition === c ? CONDITION_COLORS[c] : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        {/* 食欲 */}
        <Field label="食欲">
          <div className="flex flex-col gap-2">
            {APPETITES.map((a) => (
              <button
                key={a}
                onClick={() => setAppetite(appetite === a ? '' : a)}
                className={`py-3 rounded-xl border-2 text-sm font-medium text-left px-4 transition-all ${
                  appetite === a
                    ? 'border-orange-400 bg-orange-50 text-orange-600'
                    : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </Field>

        {/* メモ */}
        <Field label="メモ（任意）">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="気になることがあれば..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{note.length}/200</p>
        </Field>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-5 w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-40"
      >
        {saving ? '保存中...' : '保存する'}
      </button>
    </ModalShell>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  )
}
