'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Reservation } from '@/types/reservation'
import { Calendar } from 'lucide-react'

type Filter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'

const STATUS_LABELS: Record<string, string> = {
  pending: '返信待ち',
  confirmed: '確定',
  completed: '完了',
  cancelled: 'キャンセル',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-600',
  confirmed: 'bg-blue-50 text-blue-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function ReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'reservations'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setReservations(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reservation)))
      setLoading(false)
    })
    return unsub
  }, [user])

  const filtered = filter === 'all' ? reservations : reservations.filter((r) => r.status === filter)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 lg:px-10 py-4 sticky top-16 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-3">予約</h1>
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'すべて' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-10 py-6 max-w-2xl">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Calendar size={40} strokeWidth={1.5} />
            <p className="text-sm">予約がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((res) => {
              const date = res.createdAt instanceof Date
                ? res.createdAt
                : (res.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date()
              return (
                <Link key={res.id} href={`/reservations/${res.id}`}>
                  <div className="bg-white rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gray-800 text-sm">{res.shopName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[res.status] ?? ''}`}>
                        {STATUS_LABELS[res.status]}
                      </span>
                    </div>
                    {res.serviceName && (
                      <p className="text-sm text-gray-500">{res.serviceName}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{date.toLocaleDateString('ja-JP')}</p>
                    {res.servicePrice && (
                      <p className="text-sm font-medium text-orange-500 mt-1">
                        ¥{res.servicePrice.toLocaleString()}
                      </p>
                    )}
                    {res.status === 'confirmed' && res.paymentInfo?.status === 'pending' && (
                      <div className="mt-3">
                        <span className="inline-block px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg">
                          支払いへ進む →
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
