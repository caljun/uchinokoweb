'use client'

import { useEffect, useRef, useState } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, getDocs, query, limit } from 'firebase/firestore'
import { storage, db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { Camera, CheckCircle, Lock, Star } from 'lucide-react'

const MISSIONS = [
  {
    id: 'photo_post',
    title: '愛犬の写真を投稿しよう',
    description: '今日の愛犬を撮影して投稿！どんな写真でもOK',
    points: 10,
    icon: '📸',
  },
]

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function MissionsPage() {
  const { user, owner, addMissionPoints, reloadOwner } = useAuth()
  const { openAuthModal } = useAuthModal()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [pointAnim, setPointAnim] = useState<number | null>(null)
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null)
  const [dogId, setDogId] = useState<string | null>(null)

  // 今日達成済みミッション確認
  useEffect(() => {
    if (!user) return
    const today = getTodayStr()
    const check = async () => {
      const snap = await getDocs(
        query(collection(db, 'owners', user.uid, 'completedMissions'), limit(50))
      )
      const done = new Set<string>()
      snap.docs.forEach((d) => {
        if (d.id.startsWith(today)) {
          done.add(d.id.replace(`${today}_`, ''))
        }
      })
      setCompletedToday(done)
    }
    check()
  }, [user])

  // 最初の犬ID取得（写真保存先）
  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), limit(1))).then((snap) => {
      if (!snap.empty) setDogId(snap.docs[0].id)
    })
  }, [user])

  const handleMissionTap = (missionId: string) => {
    if (!user) { openAuthModal(); return }
    setActiveMissionId(missionId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !activeMissionId) return
    // inputをリセット（同じファイルを再選択できるように）
    e.target.value = ''

    const mission = MISSIONS.find((m) => m.id === activeMissionId)
    if (!mission) return

    setUploading(true)
    try {
      // Firebase Storage にアップロード
      const today = getTodayStr()
      const path = dogId
        ? `owners/${user.uid}/dogs/${dogId}/missionPhotos/${today}_${activeMissionId}.jpg`
        : `owners/${user.uid}/missionPhotos/${today}_${activeMissionId}.jpg`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const photoUrl = await getDownloadURL(storageRef)

      // ポイント付与（Firestoreトランザクション）
      const awarded = await addMissionPoints(activeMissionId, mission.points)

      if (awarded) {
        setCompletedToday((prev) => new Set(prev).add(activeMissionId))
        setPointAnim(mission.points)
        setTimeout(() => setPointAnim(null), 2000)

        // 犬の日記にも保存（任意）
        if (dogId) {
          const { addDoc, collection: col, serverTimestamp } = await import('firebase/firestore')
          await addDoc(col(db, 'owners', user.uid, 'dogs', dogId, 'diaries'), {
            photos: [photoUrl],
            comment: `ミッション達成！「${mission.title}」`,
            dogId,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          })
        }

        await reloadOwner()
      } else {
        // 今日すでに達成済みだった（別端末など）
        setCompletedToday((prev) => new Set(prev).add(activeMissionId))
      }
    } catch {
      // エラーは無視（アップロード失敗でもUX壊さない）
    } finally {
      setUploading(false)
      setActiveMissionId(null)
    }
  }

  const today = new Date()
  const dateLabel = `${today.getMonth() + 1}月${today.getDate()}日`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* +pt アニメーション */}
      {pointAnim !== null && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-5xl font-black text-orange-500 animate-bounce drop-shadow-lg">
            +{pointAnim}pt
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ミッション</h1>
            <p className="text-sm text-gray-500 mt-0.5">{dateLabel}のミッション</p>
          </div>
          {user && owner && (
            <div className="text-right">
              <p className="text-xs text-gray-400">累計ポイント</p>
              <p className="text-2xl font-black text-orange-500">{owner.totalPoints}<span className="text-sm font-bold ml-0.5">pt</span></p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">

        {/* 今週のポイント */}
        {user && owner && (
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">今週のポイント</p>
                <p className="text-3xl font-black mt-0.5">{owner.weeklyPoints}<span className="text-base font-bold ml-0.5">pt</span></p>
              </div>
              <Star size={40} className="opacity-30" />
            </div>
            <p className="text-xs opacity-70 mt-2">毎週リセット・ランキングに反映されます</p>
          </div>
        )}

        {/* ミッションカード */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 mb-3 px-1">今日のミッション</h2>
          {MISSIONS.map((mission) => {
            const done = completedToday.has(mission.id)
            const isUploading = uploading && activeMissionId === mission.id

            return (
              <div
                key={mission.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${
                  done ? 'border-green-200 bg-green-50' : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{mission.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base leading-snug">{mission.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{mission.description}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star size={14} className="text-orange-400" fill="currentColor" />
                      <span className="text-sm font-bold text-orange-500">{mission.points}ポイント</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  {done ? (
                    <div className="flex items-center justify-center gap-2 py-3 bg-green-100 rounded-xl">
                      <CheckCircle size={18} className="text-green-500" />
                      <span className="text-sm font-bold text-green-600">今日はクリア済み！</span>
                    </div>
                  ) : !user ? (
                    <button
                      onClick={() => openAuthModal()}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-500"
                    >
                      <Lock size={16} />
                      ログインして参加
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMissionTap(mission.id)}
                      disabled={isUploading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] rounded-xl text-white font-bold text-sm transition-all disabled:opacity-60"
                    >
                      {isUploading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={18} />
                      )}
                      {isUploading ? 'アップロード中...' : '写真を撮る'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 近日公開 */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 mb-3 px-1">近日追加予定</h2>
          <div className="bg-white rounded-2xl p-5 shadow-sm opacity-50">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚶</span>
              <div>
                <p className="font-bold text-gray-700">散歩ミッション</p>
                <p className="text-sm text-gray-400 mt-0.5">愛犬とのお散歩写真を投稿</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm opacity-50 mt-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">😴</span>
              <div>
                <p className="font-bold text-gray-700">寝顔ミッション</p>
                <p className="text-sm text-gray-400 mt-0.5">寝ている愛犬の写真を投稿</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
