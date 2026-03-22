'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { getChaosColor, CHAOS_COLOR_INFO } from '@/lib/mentorDiagnosis'
import type { Checkin } from '@/types/dog'

const METRICS = [
  {
    key: 'alertLevel' as const,
    label: '警戒レベル',
    description: '外の音・他犬・来客にどれだけ激しく長く反応するか',
    low: '全く反応しない',
    high: '常に激しく反応',
  },
  {
    key: 'frustrationLevel' as const,
    label: '不満レベル',
    description: '破壊行動・手足舐め・付きまといがどれだけあるか',
    low: '全くない',
    high: '頻繁にある',
  },
  {
    key: 'exhaustionLevel' as const,
    label: '疲弊レベル',
    description: '飼い主がどれだけイライラ・オロオロしてしまうか',
    low: '余裕がある',
    high: '限界に近い',
  },
]

export default function CheckinPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [values, setValues] = useState({ alertLevel: 5, frustrationLevel: 5, exhaustionLevel: 5 })
  const [prevCheckin, setPrevCheckin] = useState<Checkin | null>(null)
  const [dogId, setDogId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [savedCheckin, setSavedCheckin] = useState<Checkin | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const dogsSnap = await getDocs(query(collection(db, 'owners', user.uid, 'dogs'), limit(1)))
      if (!dogsSnap.empty) setDogId(dogsSnap.docs[0].id)

      const prevSnap = await getDocs(
        query(collection(db, 'owners', user.uid, 'checkins'), orderBy('createdAt', 'desc'), limit(1))
      )
      if (!prevSnap.empty) {
        const d = prevSnap.docs[0].data()
        setPrevCheckin({ id: prevSnap.docs[0].id, ...d, date: d.date?.toDate?.() ?? new Date(), createdAt: d.createdAt?.toDate?.() ?? new Date() } as Checkin)
      }
    }
    load()
  }, [user])

  const total = values.alertLevel + values.frustrationLevel + values.exhaustionLevel
  const chaosColor = getChaosColor(total)
  const colorInfo = CHAOS_COLOR_INFO[chaosColor]

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const data = {
        dogId: dogId ?? '',
        date: new Date(),
        alertLevel: values.alertLevel,
        frustrationLevel: values.frustrationLevel,
        exhaustionLevel: values.exhaustionLevel,
        totalChaos: total,
        chaosColor,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, 'owners', user.uid, 'checkins'), data)
      setSavedCheckin({ id: docRef.id, ...data, createdAt: new Date() } as Checkin)
      setDone(true)
    } finally {
      setSaving(false)
    }
  }

  if (done && savedCheckin) {
    const prev = prevCheckin?.totalChaos
    const diff = prev !== undefined ? savedCheckin.totalChaos - prev : null
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full space-y-5 text-center">
          <div className={`rounded-2xl p-6 ${colorInfo.bgColor} border border-${colorInfo.color}-200`}>
            <p className="text-4xl mb-2">{colorInfo.emoji}</p>
            <p className={`text-3xl font-black ${colorInfo.textColor}`}>{savedCheckin.totalChaos} / 30</p>
            <p className="font-bold text-gray-700 mt-1">{colorInfo.label}</p>
          </div>

          {diff !== null && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${diff < 0 ? 'bg-green-50 text-green-700' : diff > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
              {diff < 0 && `前回より ${Math.abs(diff)} ポイント下がりました 🎉`}
              {diff > 0 && `前回より ${diff} ポイント上がりました。ミッションを続けましょう`}
              {diff === 0 && '前回と同じスコアです'}
            </div>
          )}

          {savedCheckin.chaosColor === 'red' && (
            <p className="text-sm text-gray-500">第1章に戻って脳を冷やしましょう</p>
          )}

          <button
            onClick={() => router.push('/mentor')}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold"
          >
            ホームへ戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800">今日のチェックイン</h1>
          <p className="text-sm text-gray-400 mt-0.5">3つの指標を正直に入力してください</p>
        </div>

        <div className="px-4 py-6 space-y-6">
          {METRICS.map((metric) => (
            <div key={metric.key} className="bg-white rounded-2xl border border-gray-100 px-4 py-5">
              <p className="font-bold text-gray-800">{metric.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 mb-4">{metric.description}</p>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-black ${values[metric.key] >= 7 ? 'text-red-500' : values[metric.key] >= 4 ? 'text-yellow-500' : 'text-blue-500'}`}>
                  {values[metric.key]}
                </span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={values[metric.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [metric.key]: Number(e.target.value) }))}
                  className="flex-1 accent-orange-500"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{metric.low}</span>
                <span>{metric.high}</span>
              </div>
              {prevCheckin && (
                <p className="text-xs text-gray-400 mt-2">
                  前回: {prevCheckin[metric.key]}
                  {(() => {
                    const d = values[metric.key] - prevCheckin[metric.key]
                    if (d === 0) return ''
                    return d < 0 ? ` (▼${Math.abs(d)})` : ` (▲${d})`
                  })()}
                </p>
              )}
            </div>
          ))}

          {/* 合計プレビュー */}
          <div className={`rounded-2xl p-4 border text-center ${colorInfo.bgColor} border-${colorInfo.color}-200`}>
            <p className="text-sm text-gray-500">合計カオス度</p>
            <p className={`text-3xl font-black ${colorInfo.textColor}`}>{total} <span className="text-base font-normal text-gray-400">/ 30</span></p>
            <p className="text-sm text-gray-600 mt-0.5">{colorInfo.emoji} {colorInfo.label}</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? '記録中...' : '記録する'}
          </button>
        </div>
      </div>
    </div>
  )
}
