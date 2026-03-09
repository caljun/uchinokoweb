'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { doc, onSnapshot } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements, PaymentElement, useStripe, useElements,
} from '@stripe/react-stripe-js'
import { db, app } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Reservation } from '@/types/reservation'
import { ArrowLeft, Check, Calendar, Scissors, Dog, CreditCard } from 'lucide-react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  'pk_live_51RNoFiJNdCntc6YIaaY1t1oXFBPZaYVaKXwJ2VrKPYHyQJqEensxoFoYEb7TF0MOIjF20CNqOemOXdzPrBfS1oLU00cmJp7Qx9'
)

const STATUS_LABELS: Record<string, string> = {
  pending: '返信待ち',
  confirmed: '予約確定',
  completed: '完了',
  cancelled: 'キャンセル',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(searchParams.get('payment') === 'success')

  // Firestore リアルタイム監視
  useEffect(() => {
    if (!id) return
    const unsub = onSnapshot(doc(db, 'reservations', id), (snap) => {
      if (snap.exists()) setReservation({ id: snap.id, ...snap.data() } as Reservation)
      setLoading(false)
    })
    return unsub
  }, [id])

  // 支払い完了バナーを4秒後に消す
  useEffect(() => {
    if (!showSuccess) return
    const t = setTimeout(() => setShowSuccess(false), 4000)
    return () => clearTimeout(t)
  }, [showSuccess])

  // createReservationPayment CF を呼んで clientSecret を取得
  const handleStartPayment = async () => {
    if (!reservation || !user) return
    setLoadingPayment(true)
    setPaymentError(null)
    try {
      const fns = getFunctions(app, 'us-central1')
      const createPayment = httpsCallable<
        { reservationId: string },
        { clientSecret: string }
      >(fns, 'createReservationPayment')
      const result = await createPayment({ reservationId: id })
      setClientSecret(result.data.clientSecret)
    } catch {
      setPaymentError('決済の準備に失敗しました。もう一度お試しください。')
    } finally {
      setLoadingPayment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        予約が見つかりませんでした
      </div>
    )
  }

  // 支払い済みかどうか
  const isPaid = reservation.paymentStatus === 'paid' || reservation.status === 'completed'
  // 支払いが必要かどうか（確定済み・未払い・servicePrice あり）
  const needsPayment =
    reservation.status === 'confirmed' &&
    !isPaid &&
    !!reservation.servicePrice &&
    reservation.servicePrice > 0

  // selectedDate を Date オブジェクトに変換
  const reservationDate = reservation.selectedDate
    ? new Date(reservation.selectedDate)
    : null

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-16 z-10">
        <button onClick={() => router.back()} className="p-1.5 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-base font-bold text-gray-900">予約詳細</h1>
      </div>

      <div className="px-5 py-5 max-w-xl mx-auto space-y-4">
        {/* 支払い完了バナー */}
        {showSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Check size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-700">お支払いが完了しました</p>
              <p className="text-xs text-green-600 mt-0.5">ご予約ありがとうございます</p>
            </div>
          </div>
        )}

        {/* 予約カード */}
        <div className="bg-white rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <p className="text-base font-bold text-gray-900">{reservation.shopName}</p>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium border ${
                STATUS_COLORS[reservation.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'
              }`}
            >
              {STATUS_LABELS[reservation.status] ?? reservation.status}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {reservation.dogName && (
              <DetailRow icon={<Dog size={15} />} label="うちの子" value={reservation.dogName} />
            )}
            {reservation.serviceName && (
              <DetailRow icon={<Scissors size={15} />} label="サービス" value={reservation.serviceName} />
            )}
            {reservationDate && (
              <DetailRow
                icon={<Calendar size={15} />}
                label="日時"
                value={`${reservationDate.toLocaleDateString('ja-JP', {
                  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
                })} ${reservationDate.toLocaleTimeString('ja-JP', {
                  hour: '2-digit', minute: '2-digit',
                })}`}
              />
            )}
            {reservation.servicePrice != null && (
              <DetailRow
                icon={<CreditCard size={15} />}
                label="料金"
                value={`¥${reservation.servicePrice.toLocaleString()}`}
              />
            )}
          </div>
        </div>

        {/* エラー */}
        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{paymentError}</p>
          </div>
        )}

        {/* Stripe 決済フォーム（clientSecret 取得後に表示） */}
        {clientSecret && (
          <div className="bg-white rounded-xl p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">お支払い情報を入力</h2>
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, locale: 'ja' }}
            >
              <PaymentForm
                reservationId={id}
                onSuccess={() => {
                  setClientSecret(null)
                  setShowSuccess(true)
                }}
                onError={setPaymentError}
              />
            </Elements>
          </div>
        )}
      </div>

      {/* 固定支払いボタン（支払い前のみ） */}
      {needsPayment && !clientSecret && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-100 px-5 py-4 z-20">
          <div className="max-w-xl mx-auto">
            <button
              onClick={handleStartPayment}
              disabled={loadingPayment}
              className={`w-full py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                loadingPayment
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              <CreditCard size={18} />
              {loadingPayment
                ? '準備中...'
                : `支払う · ¥${reservation.servicePrice?.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 詳細行 ──────────────────────────────────────────────────────
function DetailRow({
  icon, label, value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  )
}

// ── Stripe 決済フォーム ──────────────────────────────────────────
function PaymentForm({
  reservationId, onSuccess, onError,
}: {
  reservationId: string
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/reservations/${reservationId}?payment=success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      onError(error.message ?? '決済に失敗しました。もう一度お試しください。')
      setSubmitting(false)
    } else {
      onSuccess()
      router.replace(`/reservations/${reservationId}?payment=success`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className={`w-full py-4 rounded-xl font-bold text-base transition-colors ${
          !stripe || submitting
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-orange-500 text-white hover:bg-orange-600'
        }`}
      >
        {submitting ? '処理中...' : '支払いを確定する'}
      </button>
    </form>
  )
}
