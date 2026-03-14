'use client'

import { useEffect, useState } from 'react'
import {
  collectionGroup, getDocs, orderBy, query, limit, where,
  collection,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Trophy, Crown, Users } from 'lucide-react'
import Link from 'next/link'

type ActiveTab = 'global' | 'friends'

interface RankDog {
  dogId: string
  ownerId: string
  name: string
  breed: string
  photoUrl?: string
  weeklyPoints: number
  totalPoints: number
}

const MEDAL = ['🥇', '🥈', '🥉']

function RankCard({ entry, rank, isMe }: { entry: RankDog; rank: number; isMe: boolean }) {
  return (
    <Link
      href={`/dogs/${entry.ownerId}/${entry.dogId}`}
      className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 transition-all active:scale-[0.99] ${
        isMe ? 'ring-2 ring-orange-400' : ''
      } ${rank <= 3 ? 'shadow-md' : ''}`}
    >
      {/* 順位 */}
      <div className="w-8 text-center shrink-0">
        {rank <= 3 ? (
          <span className="text-2xl">{MEDAL[rank - 1]}</span>
        ) : (
          <span className="text-sm font-black text-gray-400">{rank}</span>
        )}
      </div>

      {/* 犬の写真 */}
      <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 relative shrink-0">
        {entry.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.photoUrl} alt={entry.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">🐾</div>
        )}
      </div>

      {/* 犬の情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-bold truncate text-sm ${isMe ? 'text-orange-500' : 'text-gray-900'}`}>
            {entry.name}
            {isMe && <span className="text-xs ml-1 text-orange-400">（ウチの子）</span>}
          </p>
        </div>
        {entry.breed && (
          <p className="text-xs text-gray-400 mt-0.5">{entry.breed}</p>
        )}
      </div>

      {/* ポイント */}
      <div className="text-right shrink-0">
        <p className={`text-lg font-black ${rank <= 3 ? 'text-orange-500' : 'text-gray-700'}`}>
          {entry.weeklyPoints}
        </p>
        <p className="text-xs text-gray-400">pt</p>
      </div>
    </Link>
  )
}

export default function RankingPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('global')

  // 全体ランキング
  const [entries, setEntries] = useState<RankDog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 友達ランキング
  const [friendEntries, setFriendEntries] = useState<RankDog[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [friendsLoaded, setFriendsLoaded] = useState(false)

  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const snap = await getDocs(
          query(
            collectionGroup(db, 'dogs'),
            where('weeklyPoints', '>', 0),
            orderBy('weeklyPoints', 'desc'),
            limit(50)
          )
        )
        const data: RankDog[] = snap.docs.map((d) => {
          const raw = d.data()
          const ownerId = (raw.ownerId as string) ?? d.ref.parent.parent?.id ?? ''
          return {
            dogId: d.id,
            ownerId,
            name: (raw.name as string) ?? '名前なし',
            breed: (raw.breed as string) ?? '',
            photoUrl: raw.photoUrl as string | undefined,
            weeklyPoints: (raw.weeklyPoints as number) ?? 0,
            totalPoints: (raw.totalPoints as number) ?? 0,
          }
        })
        setEntries(data)
      } catch (e) {
        console.error('Ranking query error:', e)
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }
    fetchGlobal()
  }, [])

  // 友達タブを開いたとき初回のみフェッチ
  useEffect(() => {
    if (activeTab !== 'friends' || friendsLoaded || !user) return
    const fetchFriends = async () => {
      setLoadingFriends(true)
      try {
        // 友達UIDリスト取得
        const friendsSnap = await getDocs(collection(db, 'owners', user.uid, 'friends'))
        const friendUids = friendsSnap.docs.map((d) => d.id)
        const uids = [user.uid, ...friendUids].slice(0, 30)

        if (uids.length === 0) {
          setFriendEntries([])
          setFriendsLoaded(true)
          setLoadingFriends(false)
          return
        }

        const snap = await getDocs(
          query(
            collectionGroup(db, 'dogs'),
            where('ownerId', 'in', uids),
          )
        )
        const data: RankDog[] = snap.docs.map((d) => {
          const raw = d.data()
          const ownerId = (raw.ownerId as string) ?? d.ref.parent.parent?.id ?? ''
          return {
            dogId: d.id,
            ownerId,
            name: (raw.name as string) ?? '名前なし',
            breed: (raw.breed as string) ?? '',
            photoUrl: raw.photoUrl as string | undefined,
            weeklyPoints: (raw.weeklyPoints as number) ?? 0,
            totalPoints: (raw.totalPoints as number) ?? 0,
          }
        })

        // クライアントサイドでweeklyPoints降順ソート
        data.sort((a, b) => b.weeklyPoints - a.weeklyPoints)
        setFriendEntries(data)
      } catch (e) {
        console.error('Friends ranking error:', e)
      } finally {
        setFriendsLoaded(true)
        setLoadingFriends(false)
      }
    }
    fetchFriends()
  }, [activeTab, friendsLoaded, user])

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

      {/* タブ */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {([
            { key: 'global' as ActiveTab, label: '全体' },
            { key: 'friends' as ActiveTab, label: '友達' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">

        {/* ── 全体タブ ── */}
        {activeTab === 'global' && (
          loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                  <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    <div className="h-3 w-1/4 bg-gray-200 rounded" />
                  </div>
                  <div className="h-5 w-12 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-2 text-red-400">
              <p className="text-sm font-bold">エラーが発生しました</p>
              <p className="text-xs text-center break-all">{error}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
              <Crown size={48} strokeWidth={1.5} />
              <p className="text-base font-bold text-gray-500">まだランキングデータがありません</p>
              <p className="text-sm text-center text-gray-400">
                ミッションをクリアすると<br />ここに載ります！
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <RankCard
                  key={`${entry.ownerId}_${entry.dogId}`}
                  entry={entry}
                  rank={i + 1}
                  isMe={!!(user && entry.ownerId === user.uid)}
                />
              ))}
            </div>
          )
        )}

        {/* ── 友達タブ ── */}
        {activeTab === 'friends' && (
          !user ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
              <Users size={48} strokeWidth={1.5} />
              <p className="text-sm font-bold text-gray-500">ログインが必要です</p>
            </div>
          ) : loadingFriends ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
                  <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    <div className="h-3 w-1/4 bg-gray-200 rounded" />
                  </div>
                  <div className="h-5 w-12 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : friendEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
              <Users size={48} strokeWidth={1.5} />
              <p className="text-base font-bold text-gray-500">友達を追加するとここに表示されます</p>
              <Link
                href="/profile/friends"
                className="text-sm text-orange-500 hover:underline font-medium"
              >
                友達を探す
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {friendEntries.map((entry, i) => (
                <RankCard
                  key={`${entry.ownerId}_${entry.dogId}`}
                  entry={entry}
                  rank={i + 1}
                  isMe={!!(user && entry.ownerId === user.uid)}
                />
              ))}
            </div>
          )
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          ランキングは毎週月曜日にリセットされます
        </p>
      </div>
    </div>
  )
}
