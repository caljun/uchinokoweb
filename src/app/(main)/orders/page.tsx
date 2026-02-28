'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Order } from '@/types/reservation'

const STATUS_LABELS: Record<string, string> = {
  pending: '支払い待ち',
  pendingPayment: '支払い待ち',
  paid: '支払い完了',
  preparing: '準備中',
  shipped: '発送済み',
  completed: '完了',
  cancelled: 'キャンセル',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-600',
  pendingPayment: 'bg-yellow-50 text-yellow-600',
  paid: 'bg-blue-50 text-blue-600',
  preparing: 'bg-purple-50 text-purple-600',
  shipped: 'bg-indigo-50 text-indigo-600',
  completed: 'bg-green-50 text-green-600',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getDocs(
      query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      )
    ).then((snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)))
      setLoading(false)
    })
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-5 pt-5 lg:pt-6 pb-4 sticky top-0 z-10 border-b border-gray-100">
        <button onClick={() => history.back()} className="text-gray-500 text-sm mb-2">← 戻る</button>
        <h1 className="text-xl font-bold text-gray-800">注文履歴 📦</h1>
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-5xl">📦</span>
            <p className="text-gray-400 text-sm">注文履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const date = order.createdAt instanceof Date
                ? order.createdAt
                : (order.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date()
              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-800 text-sm">{order.shopName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? ''}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{date.toLocaleDateString('ja-JP')}</p>
                  <p className="text-sm font-bold text-orange-500 mt-1">
                    ¥{order.totalAmount?.toLocaleString()}
                  </p>
                  <div className="mt-2 space-y-1">
                    {order.items?.slice(0, 2).map((item, i) => (
                      <p key={i} className="text-xs text-gray-500">
                        {item.name} × {item.quantity}
                      </p>
                    ))}
                    {(order.items?.length ?? 0) > 2 && (
                      <p className="text-xs text-gray-400">他 {order.items.length - 2} 点</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
