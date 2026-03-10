'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Trophy, Crown } from 'lucide-react'

interface RankEntry {
  uid: string
  displayName?: string
  name?: string
  primaryDogName?: string
  weeklyPoints: number
  totalPoints: number
}

const MEDAL = ['🥇', '🥈', '🥉']

export default function RankingPage() {
  const { user, owner } = useAuth()
  const [entries, setEntries] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myRank, setMyRank] = useState<number | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'owners'),
            orderBy('weeklyPoints', 'desc'),
            limit(50)
          )
        )
        const data = snap.docs.map((d) => {
          const raw = d.data()
          return {
            uid: d.id,
            displayName: raw.displayName as string | undefined,
            name: raw.name as string | undefined,
            primaryDogName: raw.primaryDogName as string | undefined,
            weeklyPoints: (raw.weeklyPoints as number) ?? 0,
            totalPoints: (raw.totalPoints as number) ?? 0,
          } as RankEntry
        }).filter((e) => e.weeklyPoints > 0)

        setEntries(data)

        if (user) {
          const rank = data.findIndex((e) => e.uid === user.uid)
          setMyRank(rank >= 0 ? rank + 1 : null)
        }
      } catch {
        // Firestore ルール等でエラーの場合は空のまま
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  const displayName = (entry: RankEntry) =>
    entry.name ?? entry.displayName ?? '名無しオーナー'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-2">
          <Trophy size={22} className="text-orange-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">ランキング</h1>
            <p className="text-sm text-gray-500 mt-0.5">今週のポイントランキング・毎週リセット</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">

        {/* 自分の順位バナー */}
        {user && owner && owner.weeklyPoints > 0 && (
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-4 text-white mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">あなたの今週の順位</p>
                <p className="text-3xl font-black mt-0.5">
                  {myRank ? `${myRank}位` : '圏外'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">今週のポイント</p>
                <p className="text-2xl font-black">{owner.weeklyPoints}<span className="text-sm font-bold ml-0.5">pt</span></p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  <div className="h-3 w-1/4 bg-gray-200 rounded" />
                </div>
                <div className="h-5 w-12 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
            <Crown size={48} strokeWidth={1.5} />
            <p className="text-base font-bold text-gray-500">まだランキングデータがありません</p>
            <p className="text-sm text-center text-gray-400">
              ミッションをクリアしてポイントを獲得すると<br />ここに表示されます！
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isMe = user?.uid === entry.uid
              const rank = i + 1

              return (
                <div
                  key={entry.uid}
                  className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 transition-all ${
                    isMe ? 'ring-2 ring-orange-400' : ''
                  } ${rank <= 3 ? 'shadow-md' : ''}`}
                >
                  {/* 順位 */}
                  <div className="w-9 text-center shrink-0">
                    {rank <= 3 ? (
                      <span className="text-2xl">{MEDAL[rank - 1]}</span>
                    ) : (
                      <span className="text-base font-black text-gray-400">{rank}</span>
                    )}
                  </div>

                  {/* ユーザー情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`font-bold truncate ${isMe ? 'text-orange-500' : 'text-gray-900'}`}>
                        {displayName(entry)}
                        {isMe && <span className="text-xs ml-1 text-orange-400">（あなた）</span>}
                      </p>
                    </div>
                    {entry.primaryDogName && (
                      <p className="text-xs text-gray-400 mt-0.5">🐾 {entry.primaryDogName}</p>
                    )}
                  </div>

                  {/* ポイント */}
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-black ${rank <= 3 ? 'text-orange-500' : 'text-gray-700'}`}>
                      {entry.weeklyPoints}
                    </p>
                    <p className="text-xs text-gray-400">pt</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          ランキングは毎週月曜日にリセットされます
        </p>
      </div>
    </div>
  )
}
