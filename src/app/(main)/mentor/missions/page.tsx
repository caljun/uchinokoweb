'use client'

import { useEffect, useState } from 'react'
import {
  collection, doc, getDoc, setDoc, getDocs, query, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { CHAPTERS } from '@/data/missionChapters'
import { getMentorTitle, getNextTitleThreshold } from '@/lib/mentorDiagnosis'
import type { MentorProgress } from '@/types/dog'

export default function MissionsPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<MentorProgress | null>(null)
  const [dogId, setDogId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const dogsSnap = await getDocs(query(collection(db, 'owners', user.uid, 'dogs'), limit(1)))
      if (dogsSnap.empty) { setLoading(false); return }
      const id = dogsSnap.docs[0].id
      setDogId(id)

      const progressRef = doc(db, 'owners', user.uid, 'mentorProgress', id)
      const progressSnap = await getDoc(progressRef)
      if (progressSnap.exists()) {
        const p = progressSnap.data()
        setProgress({ ...p, updatedAt: p.updatedAt?.toDate?.() ?? new Date() } as MentorProgress)
      } else {
        // 初期化
        const initial: MentorProgress = {
          dogId: id,
          currentChapter: 1,
          mentorTitle: '見習いメンター',
          chaosReduced: 0,
          totalChaosHistory: [],
          completedMissions: [],
          updatedAt: new Date(),
        }
        await setDoc(progressRef, { ...initial, updatedAt: serverTimestamp() })
        setProgress(initial)
      }
      setLoading(false)
    }
    load()
  }, [user])

  const toggleMission = async (missionId: string) => {
    if (!user || !dogId || !progress) return
    setToggling(missionId)
    try {
      const wasCompleted = progress.completedMissions.includes(missionId)
      const next = wasCompleted
        ? progress.completedMissions.filter((id) => id !== missionId)
        : [...progress.completedMissions, missionId]

      const progressRef = doc(db, 'owners', user.uid, 'mentorProgress', dogId)
      await setDoc(progressRef, { completedMissions: next, updatedAt: serverTimestamp() }, { merge: true })
      setProgress((prev) => prev ? { ...prev, completedMissions: next } : prev)
    } finally {
      setToggling(null)
    }
  }

  const advanceChapter = async (next: number) => {
    if (!user || !dogId || !progress) return
    const progressRef = doc(db, 'owners', user.uid, 'mentorProgress', dogId)
    await setDoc(progressRef, { currentChapter: next, updatedAt: serverTimestamp() }, { merge: true })
    setProgress((prev) => prev ? { ...prev, currentChapter: next } : prev)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>
  if (!progress) return null

  const mentorTitle = getMentorTitle(progress.chaosReduced)
  const nextThreshold = getNextTitleThreshold(progress.chaosReduced)
  const currentChapter = progress.currentChapter

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800">ミッション</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-orange-600">{mentorTitle}</span>
            {nextThreshold !== null && (
              <span className="text-xs text-gray-400">
                → 次の称号まで あと {nextThreshold - progress.chaosReduced} ポイント
              </span>
            )}
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {CHAPTERS.map((chapter) => {
            const isCurrent = chapter.number === currentChapter
            const isCompleted = chapter.number < currentChapter
            const isLocked = chapter.number > currentChapter

            const chapterMissionsDone = chapter.missions.filter((m) =>
              progress.completedMissions.includes(m.id)
            ).length

            return (
              <div
                key={chapter.number}
                className={`bg-white rounded-2xl border overflow-hidden ${
                  isCurrent ? 'border-orange-200' : isCompleted ? 'border-green-200' : 'border-gray-100 opacity-60'
                }`}
              >
                {/* 章ヘッダー */}
                <div className={`px-4 py-3 flex items-center justify-between ${
                  isCurrent ? 'bg-orange-50' : isCompleted ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div>
                    <p className={`text-xs font-bold ${isCurrent ? 'text-orange-500' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                      第{chapter.number}章 {isCompleted ? '✓ 完了' : isCurrent ? '← 実施中' : '🔒 ロック'}
                    </p>
                    <p className="font-bold text-gray-800">{chapter.title}</p>
                    <p className="text-xs text-gray-400">{chapter.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{chapterMissionsDone}/{chapter.missions.length}</p>
                    {isCurrent && chapter.number < CHAPTERS.length && chapterMissionsDone === chapter.missions.length && (
                      <button
                        onClick={() => advanceChapter(chapter.number + 1)}
                        className="mt-1 text-xs text-orange-500 font-bold border border-orange-300 rounded-lg px-2 py-1"
                      >
                        次の章へ →
                      </button>
                    )}
                  </div>
                </div>

                {/* ミッションリスト */}
                {!isLocked && (
                  <div>
                    {chapter.missions.map((mission) => {
                      const done = progress.completedMissions.includes(mission.id)
                      return (
                        <button
                          key={mission.id}
                          onClick={() => toggleMission(mission.id)}
                          disabled={toggling === mission.id}
                          className="w-full flex items-start gap-3 px-4 py-3 border-t border-gray-50 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            done ? 'bg-orange-400 border-orange-400' : 'border-gray-300'
                          }`}>
                            {done && <span className="text-white text-xs">✓</span>}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {mission.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 whitespace-pre-line">{mission.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
