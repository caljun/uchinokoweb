'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

const CONDITIONS = ['元気', '普通', 'ちょっと心配', 'しんどい']
const APPETITES = ['よく食べた', '普通', 'あまり食べなかった']

const CONDITION_COLORS: Record<string, string> = {
  '元気': 'border-green-400 bg-green-50 text-green-600',
  '普通': 'border-blue-400 bg-blue-50 text-blue-600',
  'ちょっと心配': 'border-orange-400 bg-orange-50 text-orange-600',
  'しんどい': 'border-red-400 bg-red-50 text-red-600',
}

export default function HealthNewPage() {
  const { dogId } = useParams<{ dogId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [condition, setCondition] = useState('')
  const [appetite, setAppetite] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'owners', user.uid, 'dogs', dogId, 'healthRecords'), {
        dogId,
        ownerId: user.uid,
        recordDate: new Date(recordDate),
        weight: weight ? parseFloat(weight) : null,
        condition: condition || null,
        appetite: appetite || null,
        note: note || null,
        createdAt: serverTimestamp(),
      })
      router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white px-5 pt-5 lg:pt-6 pb-4 sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="text-gray-500 text-sm">キャンセル</button>
            <h1 className="text-base font-bold text-gray-800">健康記録</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-orange-500 font-bold text-sm disabled:opacity-40"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* 記録日 */}
          <Field label="記録日">
            <input
              type="date"
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className={INPUT}
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
              className={INPUT}
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
      </div>
    </div>
  )
}

const INPUT = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white text-sm'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      {children}
    </div>
  )
}
