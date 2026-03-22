'use client'

import { useEffect, useState } from 'react'
import {
  collection, doc, getDoc, getDocs, query, orderBy, limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { Dog, Checkin, MentorProgress } from '@/types/dog'
import { STATUS_INFO, getMentorTitle, CHAOS_COLOR_INFO } from '@/lib/mentorDiagnosis'
import Image from 'next/image'
import Link from 'next/link'

export default function MentorProfilePage() {
  const { user } = useAuth()
  const [dog, setDog] = useState<Dog | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [progress, setProgress] = useState<MentorProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const dogsSnap = await getDocs(query(collection(db, 'owners', user.uid, 'dogs'), limit(1)))
      if (dogsSnap.empty) { setLoading(false); return }
      const dogDoc = dogsSnap.docs[0]
      const d = dogDoc.data()
      const dogObj = { id: dogDoc.id, ...d, birthDate: d.birthDate?.toDate?.() ?? new Date(), createdAt: d.createdAt?.toDate?.() ?? new Date(), isPublic: d.isPublic ?? false, name: d.name ?? '', breed: d.breed ?? '', weight: d.weight ?? 0, gender: d.gender ?? 'male', breedSize: d.breedSize ?? 0 } as Dog
      setDog(dogObj)

      const checkinsSnap = await getDocs(
        query(collection(db, 'owners', user.uid, 'checkins'), orderBy('createdAt', 'desc'), limit(14))
      )
      setCheckins(checkinsSnap.docs.map((c) => {
        const data = c.data()
        return { id: c.id, ...data, date: data.date?.toDate?.() ?? new Date(), createdAt: data.createdAt?.toDate?.() ?? new Date() } as Checkin
      }).reverse())

      const progressRef = doc(db, 'owners', user.uid, 'mentorProgress', dogDoc.id)
      const progressSnap = await getDoc(progressRef)
      if (progressSnap.exists()) {
        const p = progressSnap.data()
        setProgress({ ...p, updatedAt: p.updatedAt?.toDate?.() ?? new Date() } as MentorProgress)
      }

      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!dog) return null

  const statusInfo = dog.mentorStatus ? STATUS_INFO[dog.mentorStatus] : null
  const mentorTitle = progress ? getMentorTitle(progress.chaosReduced) : '見習いメンター'
  const maxChaos = Math.max(...checkins.map((c) => c.totalChaos), 30)

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800">プロフィール</h1>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* 犬のカード */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 flex-shrink-0">
              {dog.photoUrl ? (
                <Image src={dog.photoUrl} alt={dog.name} width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🐕</div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800 text-lg">{dog.name}</p>
              <p className="text-xs text-gray-400">{dog.breed}</p>
              {statusInfo && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span>{statusInfo.emoji}</span>
                  <span className="text-sm font-medium text-gray-700">{statusInfo.label}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-sm font-black text-orange-500">{dog.powerScore}pt</span>
                </div>
              )}
            </div>
            <Link href={`/uchinoko/${dog.id}`} className="text-xs text-orange-500 border border-orange-200 rounded-lg px-2 py-1">
              詳細
            </Link>
          </div>

          {/* 称号 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">現在の称号</p>
            <p className="text-xl font-bold text-orange-600">{mentorTitle}</p>
            {progress && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>カオス削減量: {progress.chaosReduced}pt</span>
                  <span>第{progress.currentChapter}章</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full transition-all"
                    style={{ width: `${Math.min((progress.chaosReduced % 5) / 5 * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* カオス度グラフ */}
          {checkins.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="font-bold text-gray-800 mb-4">カオス度の推移</p>
              <div className="flex items-end gap-1 h-32">
                {checkins.map((c, i) => {
                  const colorInfo = CHAOS_COLOR_INFO[c.chaosColor]
                  const heightPct = (c.totalChaos / maxChaos) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-sm ${
                          c.chaosColor === 'red' ? 'bg-red-400' :
                          c.chaosColor === 'yellow' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`}
                        style={{ height: `${heightPct}%`, minHeight: 4 }}
                        title={`${c.totalChaos}`}
                      />
                      <span className="text-[8px] text-gray-400">
                        {new Date(c.date).getMonth() + 1}/{new Date(c.date).getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>🔴 赤: 25以上</span>
                <span>🟡 黄: 15〜24</span>
                <span>🔵 青: 14以下</span>
              </div>
            </div>
          )}

          {checkins.length === 0 && (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-gray-400 text-sm">チェックインの記録がまだありません</p>
              <Link href="/mentor/checkin" className="inline-block mt-2 text-orange-500 text-sm font-medium">
                最初のチェックインをする →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
