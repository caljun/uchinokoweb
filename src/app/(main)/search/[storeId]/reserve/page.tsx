'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  doc, getDoc, collection, getDocs, query,
  where, addDoc, serverTimestamp,
} from 'firebase/firestore'

// 定員を取得（日別 → 月別 → デフォルト3）serviceType別
async function getEffectiveCapacity(
  storeId: string,
  dateStr: string,
  serviceType: 'inStore' | 'visit' = 'inStore'
): Promise<number> {
  const monthStr = dateStr.slice(0, 7) // "YYYY-MM"
  const field = serviceType === 'visit' ? 'visitCapacity' : 'inStoreCapacity'
  const [dailySnap, monthlySnap] = await Promise.all([
    getDoc(doc(db, 'shops', storeId, 'dailyCapacities', dateStr)),
    getDoc(doc(db, 'shops', storeId, 'monthlyCapacities', monthStr)),
  ])
  if (dailySnap.exists()) {
    const data = dailySnap.data() as Record<string, number>
    const v = data[field] ?? data['capacity']
    if (typeof v === 'number') return v
  }
  if (monthlySnap.exists()) {
    const data = monthlySnap.data() as Record<string, number>
    const v = data[field] ?? data['capacity']
    if (typeof v === 'number') return v
  }
  return 3
}
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { Store, WeeklyOpenHours } from '@/types/store'
import { Dog } from '@/types/dog'
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react'

// 曜日キーのマッピング
const DAY_KEY_MAP: Record<number, keyof WeeklyOpenHours> = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
}

// "09:00" ~ "18:00" → ["09:00", "10:00", ..., "17:00"]
function generateTimeSlots(open: string, close: string): string[] {
  const slots: string[] = []
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  let totalMins = oh * 60 + om
  const closeTotal = ch * 60 + cm
  while (totalMins < closeTotal) {
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    totalMins += 60
  }
  return slots
}

type DayStatus = 'open' | 'holiday' | 'no-hours'

export default function ReservationPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const router = useRouter()
  const { user, owner } = useAuth()
  const { openAuthModal } = useAuthModal()

  const [store, setStore] = useState<Store | null>(null)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // フォーム選択値
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null)
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)

  // カレンダー状態
  const [calMonth, setCalMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  // 時間帯状態
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({})
  const [capacity, setCapacity] = useState(3)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [dayStatus, setDayStatus] = useState<DayStatus | null>(null)

  // 最短予約日（2日後）
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 2)
  minDate.setHours(0, 0, 0, 0)

  // 店舗・犬データ読み込み
  useEffect(() => {
    if (!storeId) return
    const load = async () => {
      const snap = await getDoc(doc(db, 'shops', storeId))
      if (snap.exists()) setStore({ id: snap.id, ...snap.data() } as Store)

      if (user) {
        const dogsSnap = await getDocs(collection(db, 'owners', user.uid, 'dogs'))
        const list = dogsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Dog))
        setDogs(list)
        if (list.length === 1) setSelectedDogId(list[0].id ?? null)
      }
      setLoading(false)
    }
    load().catch(() => setLoading(false))
  }, [storeId, user])

  // 日付・サービス選択 → 時間帯を生成 & 定員チェック
  useEffect(() => {
    if (!selectedDate || !store) return
    setSelectedTimeSlot(null)
    setLoadingSlots(true)

    const loadSlots = async () => {
      const dayKey = DAY_KEY_MAP[selectedDate.getDay()]
      const openHours = store.openHours

      let open: string | null = null
      let close: string | null = null

      if (openHours && typeof openHours === 'object') {
        const dayHours = (openHours as WeeklyOpenHours)[dayKey]
        if (!dayHours) {
          setDayStatus('holiday')
          setTimeSlots([])
          setLoadingSlots(false)
          return
        }
        open = dayHours.open
        close = dayHours.close
      } else {
        // WeeklyOpenHours がない場合は時間帯なし
        setDayStatus('no-hours')
        setTimeSlots([])
        setLoadingSlots(false)
        return
      }

      const slots = generateTimeSlots(open, close)
      setDayStatus('open')
      setTimeSlots(slots)

      // 選択中サービスの種別で定員を分離
      const service = selectedServiceIndex !== null && store.services
        ? store.services[selectedServiceIndex]
        : null
      const serviceType: 'inStore' | 'visit' = service?.type === 'visit' ? 'visit' : 'inStore'

      // 定員 & 予約済みスロット数を並行取得（同種別のみカウント）
      const dateStr = selectedDate.toISOString().split('T')[0]
      const [cap, resSnap] = await Promise.all([
        getEffectiveCapacity(storeId, dateStr, serviceType),
        getDocs(
          query(
            collection(db, 'reservations'),
            where('storeId', '==', storeId),
            where('dateStr', '==', dateStr),
            where('serviceType', '==', serviceType),
            where('status', 'in', ['confirmed', 'completed']),
          )
        ),
      ])
      setCapacity(cap)
      const counts: Record<string, number> = {}
      for (const d of resSnap.docs) {
        const ts = (d.data() as { timeSlot?: string }).timeSlot
        if (ts) counts[ts] = (counts[ts] ?? 0) + 1
      }
      setSlotCounts(counts)
      setLoadingSlots(false)
    }

    loadSlots().catch(() => setLoadingSlots(false))
  }, [selectedDate, store, storeId, selectedServiceIndex])

  const handleSubmit = async () => {
    if (!user || !store || !selectedDogId || selectedServiceIndex === null || !selectedDate || !selectedTimeSlot) return
    setSubmitting(true)
    try {
      const dog = dogs.find((d) => d.id === selectedDogId)!
      const service = store.services![selectedServiceIndex]
      const dateStr = selectedDate.toISOString().split('T')[0]

      // JST (+09:00) の ISO8601 文字列を生成（uchinokotempo / iOS と形式を統一）
      const [h, m] = selectedTimeSlot.split(':').map(Number)
      const dt = new Date(selectedDate)
      dt.setHours(h, m, 0, 0)
      const offsetMs = 9 * 60 * 60 * 1000
      const jstMs = dt.getTime() + offsetMs
      const jstDate = new Date(jstMs)
      const pad = (n: number) => String(n).padStart(2, '0')
      const selectedDateISO =
        `${jstDate.getUTCFullYear()}-${pad(jstDate.getUTCMonth() + 1)}-${pad(jstDate.getUTCDate())}` +
        `T${pad(jstDate.getUTCHours())}:${pad(jstDate.getUTCMinutes())}:00+09:00`

      const docRef = await addDoc(collection(db, 'reservations'), {
        storeId,
        shopName: store.name,
        userId: user.uid,
        dogId: selectedDogId,
        dogName: dog.name,
        dogPhoto: dog.photoUrl ?? null,
        dogInfo: {
          name: dog.name,
          photoUrl: dog.photoUrl ?? null,
          breed: dog.breed,
          breedSize: dog.breedSize,
        },
        // Webhook が visitingDogs に書き込む際に参照する
        ownerInfo: {
          name: owner?.name ?? owner?.displayName ?? null,
          email: owner?.email ?? null,
          phone: owner?.phone ?? null,
        },
        serviceId: service.id ?? null,
        serviceName: service.name,
        servicePrice: service.price,
        totalAmount: Math.round(service.price * 1.1), // 顧客支払額（手数料10%込み）
        serviceType: service.type ?? 'inStore',
        dateStr,
        timeSlot: selectedTimeSlot,
        selectedDate: selectedDateISO,
        requestedDates: [selectedDateISO],
        status: 'confirmed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      router.push(`/reservations/${docRef.id}`)
    } catch (e) {
      console.error(e)
      setSubmitting(false)
    }
  }

  const isFormValid =
    !!selectedDogId && selectedServiceIndex !== null && !!selectedDate && !!selectedTimeSlot

  // ── 未ログイン ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-20 px-6 gap-5">
        <p className="text-gray-500 text-sm text-center">予約するにはログインが必要です</p>
        <button
          onClick={openAuthModal}
          className="w-full max-w-xs py-3 bg-orange-500 text-white rounded-xl font-bold text-sm"
        >
          ログイン / 新規登録
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        店舗が見つかりませんでした
      </div>
    )
  }

  // カレンダー計算
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const calYear = calMonth.getFullYear()
  const calMonthIndex = calMonth.getMonth()
  const firstDow = new Date(calYear, calMonthIndex, 1).getDay()
  const daysInMonth = new Date(calYear, calMonthIndex + 1, 0).getDate()
  const calCells: (Date | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(calYear, calMonthIndex, i + 1)),
  ]
  while (calCells.length % 7 !== 0) calCells.push(null)

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-16 z-10">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <p className="text-xs text-gray-400">{store.name}</p>
          <h1 className="text-base font-bold text-gray-900">予約する</h1>
        </div>
      </div>

      <div className="px-5 py-5 max-w-xl mx-auto space-y-6">
        {/* ── 犬の選択 ── */}
        <FormSection title="どの子で予約する？">
          {dogs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              うちの子を先に登録してください
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {dogs.map((dog) => (
                <button
                  key={dog.id}
                  onClick={() => setSelectedDogId(dog.id ?? null)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-colors ${
                    selectedDogId === dog.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {dog.photoUrl ? (
                    <div className="w-7 h-7 rounded-full overflow-hidden relative flex-shrink-0">
                      <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-sm">
                      🐕
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-800">{dog.name}</span>
                  {selectedDogId === dog.id && <Check size={14} className="text-orange-500" />}
                </button>
              ))}
            </div>
          )}
        </FormSection>

        {/* ── サービス選択 ── */}
        <FormSection title="サービスを選ぶ">
          {!store.services || store.services.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">サービスが登録されていません</p>
          ) : (
            <div className="space-y-2">
              {store.services.map((service, i) => (
                <button
                  key={service.id ?? i}
                  onClick={() => setSelectedServiceIndex(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    selectedServiceIndex === i
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{service.description}</p>
                      )}
                      {service.duration && (
                        <p className="text-xs text-gray-400 mt-1">{service.duration}分</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-orange-500">
                          ¥{Math.round(service.price * 1.1).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400">手数料込み</p>
                      </div>
                      {selectedServiceIndex === i && <Check size={14} className="text-orange-500" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </FormSection>

        {/* ── 日付選択（カレンダー） ── */}
        <FormSection title="日付を選ぶ">
          <div className="bg-white rounded-xl p-4">
            {/* 月ナビ */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <p className="text-sm font-bold text-gray-800">
                {calYear}年{calMonthIndex + 1}月
              </p>
              <button
                onClick={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </div>
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 mb-1">
              {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                <div
                  key={d}
                  className={`text-center text-xs py-1 font-medium ${
                    i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>
            {/* 日付セル */}
            <div className="grid grid-cols-7 gap-y-1">
              {calCells.map((date, i) => {
                if (!date) return <div key={i} />
                const disabled = date < minDate
                const isSelected = selectedDate?.toDateString() === date.toDateString()
                const isToday = today.toDateString() === date.toDateString()
                const dow = date.getDay()
                return (
                  <button
                    key={i}
                    onClick={() => !disabled && setSelectedDate(date)}
                    disabled={disabled}
                    className={`aspect-square flex items-center justify-center rounded-full text-sm transition-colors ${
                      isSelected
                        ? 'bg-orange-500 text-white font-bold'
                        : disabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : isToday
                        ? 'font-bold text-orange-500 hover:bg-orange-50'
                        : dow === 0
                        ? 'text-red-400 hover:bg-red-50'
                        : dow === 6
                        ? 'text-blue-400 hover:bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        </FormSection>

        {/* ── 時間帯選択 ── */}
        {selectedDate && (
          <FormSection title="時間帯を選ぶ">
            {loadingSlots ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : dayStatus === 'holiday' ? (
              <p className="text-sm text-gray-400 text-center py-6">この日は定休日です</p>
            ) : dayStatus === 'no-hours' ? (
              <p className="text-sm text-gray-400 text-center py-6">
                営業時間が設定されていません
              </p>
            ) : timeSlots.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">この日は満席です</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((slot) => {
                  const count = slotCounts[slot] ?? 0
                  const full = count >= capacity
                  return (
                    <button
                      key={slot}
                      onClick={() => !full && setSelectedTimeSlot(slot)}
                      disabled={full}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                        selectedTimeSlot === slot
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : full
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : 'border-gray-200 text-gray-700 hover:border-orange-300 bg-white'
                      }`}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            )}
          </FormSection>
        )}
      </div>

      {/* 固定送信バー */}
      <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 px-5 py-4 z-40">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || submitting}
            className={`w-full py-4 rounded-xl font-bold text-base transition-colors ${
              isFormValid && !submitting
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? '送信中...' : '予約を確定する'}
          </button>
          {isFormValid && store.services && selectedServiceIndex !== null && selectedDate && selectedTimeSlot && (
            <p className="text-center text-xs text-gray-400 mt-2">
              {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}{' '}
              {selectedTimeSlot} · {store.services[selectedServiceIndex].name} ·{' '}
              ¥{Math.round(store.services[selectedServiceIndex].price * 1.1).toLocaleString()}（手数料込み）
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      {children}
    </div>
  )
}
