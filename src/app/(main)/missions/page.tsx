'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { collection, getDocs, query, limit, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { storage, db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { Camera, CheckCircle, Lock, Star, Sparkles } from 'lucide-react'
import { Dog } from '@/types/dog'

const DAILY_MISSIONS = [
  {
    id: 'photo_post',
    title: '今日の一枚',
    description: '今日の愛犬を撮影して投稿！どんな写真でもOK',
    points: 10,
    icon: '📸',
  },
  {
    id: 'walk_photo',
    title: 'お散歩ショット',
    description: '愛犬とのお散歩中の写真を投稿しよう',
    points: 10,
    icon: '🚶',
  },
  {
    id: 'sit_photo',
    title: 'お座りショット',
    description: 'お座りしている愛犬の写真を投稿しよう',
    points: 10,
    icon: '🐾',
  },
]

const WEEKLY_MISSION = {
  id: 'weekly_best',
  title: '今週のベストショット',
  description: '今週一番かわいい写真を1枚！週1回だけ挑戦できる',
  points: 30,
  icon: '✨',
}

function getTodayStr() {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

function getCurrentWeekStr(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const d = new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export default function MissionsPage() {
  const { user, addMissionPoints, addWeeklyMissionPoints } = useAuth()
  const { openAuthModal } = useAuthModal()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [dogs, setDogs] = useState<Dog[]>([])
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null)
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())
  const [completedThisWeek, setCompletedThisWeek] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [pointAnim, setPointAnim] = useState<number | null>(null)
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null)
  const [isWeeklyActive, setIsWeeklyActive] = useState(false)
  const [dogsLoading, setDogsLoading] = useState(true)

  // 犬一覧取得
  useEffect(() => {
    if (!user) { setDogsLoading(false); return }
    getDocs(collection(db, 'owners', user.uid, 'dogs')).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dog))
      setDogs(list)
      if (list.length > 0) setSelectedDog(list[0])
    }).finally(() => setDogsLoading(false))
  }, [user])

  // 選択中の犬の達成チェック
  useEffect(() => {
    if (!user || !selectedDog?.id) return
    const today = getTodayStr()
    const weekStr = getCurrentWeekStr()
    getDocs(query(collection(db, 'owners', user.uid, 'dogs', selectedDog.id, 'completedMissions'), limit(50)))
      .then((snap) => {
        const doneToday = new Set<string>()
        const doneWeek = new Set<string>()
        snap.docs.forEach((d) => {
          if (d.id.startsWith(today + '_')) doneToday.add(d.id.replace(`${today}_`, ''))
          if (d.id.startsWith(weekStr + '_')) doneWeek.add(d.id.replace(`${weekStr}_`, ''))
        })
        setCompletedToday(doneToday)
        setCompletedThisWeek(doneWeek)
      })
  }, [user, selectedDog?.id])

  const handleMissionTap = (missionId: string, isWeekly: boolean) => {
    if (!user) { openAuthModal(); return }
    if (!selectedDog) return
    setActiveMissionId(missionId)
    setIsWeeklyActive(isWeekly)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !activeMissionId || !selectedDog?.id) return
    e.target.value = ''

    const mission = isWeeklyActive
      ? (WEEKLY_MISSION.id === activeMissionId ? WEEKLY_MISSION : null)
      : DAILY_MISSIONS.find((m) => m.id === activeMissionId)
    if (!mission) return

    setUploading(true)
    try {
      const keyPrefix = isWeeklyActive ? getCurrentWeekStr() : getTodayStr()
      const path = `owners/${user.uid}/dogs/${selectedDog.id}/missionPhotos/${keyPrefix}_${activeMissionId}.jpg`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const photoUrl = await getDownloadURL(storageRef)

      const awarded = isWeeklyActive
        ? await addWeeklyMissionPoints(selectedDog.id, activeMissionId, mission.points)
        : await addMissionPoints(selectedDog.id, activeMissionId, mission.points)

      if (awarded) {
        if (isWeeklyActive) {
          setCompletedThisWeek((prev) => new Set(prev).add(activeMissionId))
        } else {
          setCompletedToday((prev) => new Set(prev).add(activeMissionId))
        }
        setPointAnim(mission.points)
        setTimeout(() => setPointAnim(null), 2000)

        // 日記（ギャラリー用）にも保存
        await setDoc(
          doc(collection(db, 'owners', user.uid, 'dogs', selectedDog.id, 'diaries')),
          {
            photos: [photoUrl],
            comment: `ミッション達成！「${mission.title}」`,
            dogId: selectedDog.id,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
          }
        )

        setSelectedDog((prev) => prev ? {
          ...prev,
          weeklyPoints: (prev.weeklyPoints ?? 0) + mission.points,
          totalPoints: (prev.totalPoints ?? 0) + mission.points,
        } : prev)
      } else {
        if (isWeeklyActive) {
          setCompletedThisWeek((prev) => new Set(prev).add(activeMissionId))
        } else {
          setCompletedToday((prev) => new Set(prev).add(activeMissionId))
        }
      }
    } catch {
      // エラー時もUX壊さない
    } finally {
      setUploading(false)
      setActiveMissionId(null)
      setIsWeeklyActive(false)
    }
  }

  const today = new Date()
  const dateLabel = `${today.getMonth() + 1}月${today.getDate()}日`

  const MissionCard = ({
    mission,
    done,
    isUploading,
    isWeekly,
  }: {
    mission: typeof WEEKLY_MISSION
    done: boolean
    isUploading: boolean
    isWeekly: boolean
  }) => (
    <div
      className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all mb-3 ${
        done ? 'border-green-200 bg-green-50' : isWeekly ? 'border-orange-200' : 'border-transparent'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{mission.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-snug">{mission.title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed mt-1">{mission.description}</p>
          <div className="flex items-center gap-1.5 mt-2">
            {isWeekly ? (
              <Sparkles size={14} className="text-orange-400" />
            ) : (
              <Star size={14} className="text-orange-400" fill="currentColor" />
            )}
            <span className="text-sm font-bold text-orange-500">{mission.points}ポイント</span>
            {isWeekly && <span className="text-xs text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">週1回</span>}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {done ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-green-100 rounded-xl">
            <CheckCircle size={18} className="text-green-500" />
            <span className="text-sm font-bold text-green-600">
              {isWeekly ? '今週はクリア済み！' : '今日はクリア済み！'}
            </span>
          </div>
        ) : !user ? (
          <button
            onClick={() => openAuthModal()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-500"
          >
            <Lock size={16} />
            ログインして参加
          </button>
        ) : !selectedDog ? (
          <div className="w-full flex items-center justify-center py-3 bg-gray-100 rounded-xl text-sm text-gray-400">
            上から犬を選んでください
          </div>
        ) : (
          <button
            onClick={() => handleMissionTap(mission.id, isWeekly)}
            disabled={isUploading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-60 active:scale-[0.98] ${
              isWeekly ? 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isUploading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera size={18} />
            )}
            {isUploading ? 'アップロード中...' : `${selectedDog.name}の写真を撮る`}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
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
        <h1 className="text-xl font-bold text-gray-900">ミッション</h1>
        <p className="text-sm text-gray-500 mt-0.5">{dateLabel}のミッション</p>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">

        {/* 犬セレクター */}
        {user && (
          <div>
            <p className="text-xs font-bold text-gray-400 mb-2 px-1">参加する子を選ぼう</p>
            {dogsLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {[1, 2].map((i) => (
                  <div key={i} className="shrink-0 w-20 h-24 bg-white rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : dogs.length === 0 ? (
              <div className="bg-white rounded-2xl p-4 text-center text-sm text-gray-400">
                まず「ウチの子」を登録してください
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
                {dogs.map((dog) => {
                  const isSelected = selectedDog?.id === dog.id
                  return (
                    <button
                      key={dog.id}
                      onClick={() => setSelectedDog(dog)}
                      className={`shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 transition-all w-20 ${
                        isSelected
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-transparent bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 relative">
                        {dog.photoUrl ? (
                          <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                        )}
                      </div>
                      <p className={`text-xs font-bold truncate w-full text-center ${isSelected ? 'text-orange-500' : 'text-gray-600'}`}>
                        {dog.name}
                      </p>
                      {(dog.weeklyPoints ?? 0) > 0 && (
                        <p className="text-[10px] text-orange-400 font-bold">{dog.weeklyPoints}pt</p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 選択中の犬のポイント */}
        {user && selectedDog && (
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">{selectedDog.name}の今週のポイント</p>
                <p className="text-3xl font-black mt-0.5">
                  {selectedDog.weeklyPoints ?? 0}
                  <span className="text-base font-bold ml-0.5">pt</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">累計</p>
                <p className="text-xl font-black">{selectedDog.totalPoints ?? 0}<span className="text-sm font-bold ml-0.5">pt</span></p>
              </div>
            </div>
          </div>
        )}

        {/* 毎日ミッション */}
        {(!user || selectedDog) && (
          <div>
            <h2 className="text-sm font-bold text-gray-500 mb-3 px-1">毎日ミッション <span className="text-orange-400">各+10pt</span></h2>
            {DAILY_MISSIONS.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                done={completedToday.has(mission.id)}
                isUploading={uploading && activeMissionId === mission.id}
                isWeekly={false}
              />
            ))}
          </div>
        )}

        {/* スペシャルミッション */}
        {(!user || selectedDog) && (
          <div>
            <h2 className="text-sm font-bold text-gray-500 mb-3 px-1">
              スペシャルミッション <span className="text-orange-400">+{WEEKLY_MISSION.points}pt</span>
            </h2>
            <MissionCard
              mission={WEEKLY_MISSION}
              done={completedThisWeek.has(WEEKLY_MISSION.id)}
              isUploading={uploading && activeMissionId === WEEKLY_MISSION.id}
              isWeekly={true}
            />
          </div>
        )}

      </div>
    </div>
  )
}
