'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  collection, query, orderBy, limit, getDocs,
  doc, getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { Dog, Checkin, MentorProgress } from '@/types/dog'
import {
  CHAOS_COLOR_INFO,
  STATUS_INFO,
  getMentorTitle,
  getNextTitleThreshold,
} from '@/lib/mentorDiagnosis'
import { CHAPTERS } from '@/data/missionChapters'

export default function MentorHomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [dog, setDog] = useState<Dog | null>(null)
  const [latestCheckin, setLatestCheckin] = useState<Checkin | null>(null)
  const [progress, setProgress] = useState<MentorProgress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        // 最初の犬を取得
        const dogsSnap = await getDocs(query(collection(db, 'owners', user.uid, 'dogs'), limit(1)))
        if (dogsSnap.empty) { router.push('/uchinoko/new'); return }
        const dogDoc = dogsSnap.docs[0]
        const dogData = dogDoc.data()
        setDog({ id: dogDoc.id, ...dogData, birthDate: dogData.birthDate?.toDate?.() ?? new Date(), createdAt: dogData.createdAt?.toDate?.() ?? new Date(), isPublic: dogData.isPublic ?? false, name: dogData.name ?? '', breed: dogData.breed ?? '', weight: dogData.weight ?? 0, gender: dogData.gender ?? 'male', breedSize: dogData.breedSize ?? 0 } as Dog)

        const dogId = dogDoc.id

        // 最新チェックイン
        const checkinSnap = await getDocs(
          query(collection(db, 'owners', user.uid, 'checkins'), orderBy('createdAt', 'desc'), limit(1))
        )
        if (!checkinSnap.empty) {
          const c = checkinSnap.docs[0].data()
          setLatestCheckin({ id: checkinSnap.docs[0].id, ...c, date: c.date?.toDate?.() ?? new Date(), createdAt: c.createdAt?.toDate?.() ?? new Date() } as Checkin)
        }

        // メンタープログレス
        const progressRef = doc(db, 'owners', user.uid, 'mentorProgress', dogId)
        const progressSnap = await getDoc(progressRef)
        if (progressSnap.exists()) {
          const p = progressSnap.data()
          setProgress({ ...p, updatedAt: p.updatedAt?.toDate?.() ?? new Date() } as MentorProgress)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!dog) return null

  const chaosInfo = latestCheckin ? CHAOS_COLOR_INFO[latestCheckin.chaosColor] : null
  const currentChapter = progress?.currentChapter ?? 1
  const chapter = CHAPTERS[currentChapter - 1]
  const mentorTitle = progress ? getMentorTitle(progress.chaosReduced) : '見習いメンター'
  const nextThreshold = progress ? getNextTitleThreshold(progress.chaosReduced) : 5
  const chaosReduced = progress?.chaosReduced ?? 0
  const statusInfo = dog.mentorStatus ? STATUS_INFO[dog.mentorStatus] : null

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {/* 犬の情報ヘッダー */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-orange-100 flex-shrink-0">
            {dog.photoUrl ? (
              <Image src={dog.photoUrl} alt={dog.name} width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🐕</div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">メンター称号</p>
            <p className="font-bold text-gray-800">{mentorTitle}</p>
            {nextThreshold !== null && (
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden w-32">
                <div
                  className="h-full bg-orange-400 rounded-full transition-all"
                  style={{ width: `${Math.min((chaosReduced % 5) / 5 * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
          {dog.powerScore !== undefined && statusInfo && (
            <div className="text-right">
              <p className="text-xs text-gray-400">パワー値</p>
              <p className="text-2xl font-black text-orange-500">{dog.powerScore}</p>
              <p className="text-xs text-gray-500">{statusInfo.emoji} {statusInfo.label}</p>
            </div>
          )}
        </div>

        {/* カオス度スコア */}
        <div className={`rounded-2xl p-5 border ${chaosInfo ? chaosInfo.bgColor + ' border-' + chaosInfo.color + '-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500">今日のカオス度</p>
              {latestCheckin ? (
                <>
                  <p className={`text-4xl font-black ${chaosInfo?.textColor ?? 'text-gray-800'}`}>
                    {latestCheckin.totalChaos}
                    <span className="text-lg font-normal text-gray-400"> / 30</span>
                  </p>
                  <p className="text-sm font-medium text-gray-600 mt-0.5">
                    {chaosInfo?.emoji} {chaosInfo?.label}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-1">まだ記録がありません</p>
              )}
            </div>
            <Link
              href="/mentor/checkin"
              className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold"
            >
              チェックイン
            </Link>
          </div>
          {latestCheckin && (
            <div className="flex gap-2 text-xs text-gray-500">
              <span>警戒 {latestCheckin.alertLevel}</span>
              <span>·</span>
              <span>不満 {latestCheckin.frustrationLevel}</span>
              <span>·</span>
              <span>疲弊 {latestCheckin.exhaustionLevel}</span>
            </div>
          )}
        </div>

        {/* 今日のミッション */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div>
              <p className="text-xs text-gray-400">第{currentChapter}章</p>
              <p className="font-bold text-gray-800">{chapter.title}</p>
            </div>
            <Link href="/mentor/missions" className="text-xs text-orange-500 font-medium">
              すべて見る →
            </Link>
          </div>
          {chapter.missions.slice(0, 2).map((mission) => {
            const done = progress?.completedMissions?.includes(mission.id) ?? false
            return (
              <div key={mission.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${done ? 'bg-orange-400 border-orange-400' : 'border-gray-300'}`}>
                  {done && <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>}
                </div>
                <div>
                  <p className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{mission.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{mission.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 問題行動ショートカット */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
          <p className="font-bold text-gray-800 mb-3">困っている行動は？</p>
          <Link
            href="/mentor/behaviors"
            className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100"
          >
            <div>
              <p className="text-sm font-medium text-orange-700">問題行動ライブラリ</p>
              <p className="text-xs text-gray-500 mt-0.5">10の行動から犬の気持ちを知る</p>
            </div>
            <span className="text-orange-400">→</span>
          </Link>
        </div>

        {/* 診断再受診 */}
        {!dog.powerScore && (
          <div className="bg-orange-50 rounded-2xl border border-orange-100 px-4 py-4">
            <p className="font-bold text-gray-800 mb-1">パワー値がまだ未設定です</p>
            <p className="text-sm text-gray-500 mb-3">犬の詳細ページから診断を実施してください</p>
            <Link href={`/uchinoko/${dog.id}`} className="text-sm text-orange-500 font-medium">
              犬の詳細へ →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
