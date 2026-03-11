'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  collection, query, where, getDocs, doc, getDoc,
  updateDoc, deleteDoc, setDoc, serverTimestamp, orderBy, addDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Users, Search } from 'lucide-react'

type ActiveTab = 'search' | 'requests' | 'friends'

interface FriendRequest {
  id: string
  fromUid: string
  displayName: string
  photoUrl?: string
}

interface FriendEntry {
  uid: string
  displayName: string
  photoUrl?: string
  since: unknown
}

interface SearchResult {
  uid: string
  displayName: string
  friendId: string
  photoUrl?: string
}

export default function FriendsPage() {
  const router = useRouter()
  const { user, owner } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('search')

  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  const [friends, setFriends] = useState<FriendEntry[]>([])
  const [loadingFriends, setLoadingFriends] = useState(true)

  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // 検索
  const [searchFriendId, setSearchFriendId] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null | 'notfound'>('notfound')
  const [searchDone, setSearchDone] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    if (!user) return
    fetchRequests()
    fetchFriends()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchRequests = async () => {
    if (!user) return
    setLoadingRequests(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'friendRequests'),
          where('toUid', '==', user.uid),
          where('status', '==', 'pending'),
        )
      )
      const results: FriendRequest[] = await Promise.all(
        snap.docs.map(async (d) => {
          const fromUid = d.data().fromUid as string
          let displayName = 'オーナー'
          let photoUrl: string | undefined
          try {
            const ownerSnap = await getDoc(doc(db, 'owners', fromUid))
            if (ownerSnap.exists()) {
              displayName = (ownerSnap.data().displayName as string) ?? 'オーナー'
              photoUrl = ownerSnap.data().photoUrl as string | undefined
            }
          } catch {}
          return { id: d.id, fromUid, displayName, photoUrl }
        })
      )
      setRequests(results)
    } catch {}
    setLoadingRequests(false)
  }

  const fetchFriends = async () => {
    if (!user) return
    setLoadingFriends(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, 'owners', user.uid, 'friends'),
          orderBy('since', 'desc'),
        )
      )
      const results: FriendEntry[] = snap.docs.map((d) => ({
        uid: d.id,
        displayName: (d.data().displayName as string) ?? 'オーナー',
        photoUrl: d.data().photoUrl as string | undefined,
        since: d.data().since,
      }))
      setFriends(results)
    } catch {}
    setLoadingFriends(false)
  }

  const handleSearch = async () => {
    if (!user || !searchFriendId.trim()) return
    setSearching(true)
    setSearchDone(false)
    setSearchResult('notfound')
    setRequestSent(false)
    try {
      const snap = await getDocs(
        query(collection(db, 'owners'), where('friendId', '==', searchFriendId.trim().toUpperCase()))
      )
      if (snap.empty) {
        setSearchResult('notfound')
      } else {
        const d = snap.docs[0]
        const data = d.data()
        setSearchResult({
          uid: d.id,
          displayName: (data.displayName as string) ?? 'オーナー',
          friendId: (data.friendId as string) ?? '',
          photoUrl: data.photoUrl as string | undefined,
        })
      }
    } catch {
      setSearchResult('notfound')
    }
    setSearchDone(true)
    setSearching(false)
  }

  const handleSendRequest = async (toUid: string) => {
    if (!user || actionLoading) return
    setActionLoading(toUid)
    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUid: user.uid,
        toUid,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setRequestSent(true)
    } catch {}
    setActionLoading(null)
  }

  const handleAccept = async (req: FriendRequest) => {
    if (!user || actionLoading) return
    setActionLoading(req.id)
    try {
      await updateDoc(doc(db, 'friendRequests', req.id), { status: 'accepted' })
      const now = serverTimestamp()
      await Promise.all([
        setDoc(doc(db, 'owners', user.uid, 'friends', req.fromUid), {
          since: now,
          displayName: req.displayName,
          photoUrl: req.photoUrl ?? null,
        }),
        setDoc(doc(db, 'owners', req.fromUid, 'friends', user.uid), {
          since: now,
          displayName: owner?.displayName ?? 'オーナー',
          photoUrl: owner?.photoUrl ?? null,
        }),
      ])
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      setFriends((prev) => [
        { uid: req.fromUid, displayName: req.displayName, photoUrl: req.photoUrl, since: null },
        ...prev,
      ])
    } catch {}
    setActionLoading(null)
  }

  const handleReject = async (req: FriendRequest) => {
    if (!user || actionLoading) return
    setActionLoading(req.id)
    try {
      await deleteDoc(doc(db, 'friendRequests', req.id))
      setRequests((prev) => prev.filter((r) => r.id !== req.id))
    } catch {}
    setActionLoading(null)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 text-gray-400">
        <p className="text-sm">ログインが必要です</p>
        <button onClick={() => router.back()} className="text-sm text-orange-500 hover:underline">戻る</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1.5 -ml-1.5 text-gray-500 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-gray-900">友達</h1>
      </div>

      {/* タブ */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">
          {([
            { key: 'search' as ActiveTab, label: '検索' },
            { key: 'requests' as ActiveTab, label: '申請' },
            { key: 'friends' as ActiveTab, label: '友達' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {key === 'requests' && requests.length > 0 && (
                <span className="ml-1.5 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-5">

        {/* 検索タブ */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">友達のIDを入力して検索（例：ABC123）</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchFriendId}
                onChange={(e) => { setSearchFriendId(e.target.value); setSearchDone(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ABC123"
                maxLength={6}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 uppercase"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchFriendId.trim()}
                className="px-4 py-3 bg-orange-500 text-white rounded-xl disabled:opacity-50 transition-colors hover:bg-orange-600"
              >
                <Search size={18} />
              </button>
            </div>

            {searching && (
              <div className="bg-white rounded-xl p-4 animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                <div className="h-4 w-1/3 bg-gray-200 rounded" />
              </div>
            )}

            {searchDone && searchResult === 'notfound' && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">このメールアドレスのユーザーが見つかりませんでした</p>
              </div>
            )}

            {searchDone && searchResult && searchResult !== 'notfound' && (
              <div className="bg-white rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-lg font-bold text-orange-500 shrink-0">
                  {searchResult.photoUrl ? (
                    <img src={searchResult.photoUrl} alt={searchResult.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{searchResult.displayName?.[0] ?? 'U'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{searchResult.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">ID: {searchResult.friendId}</p>
                </div>
                {searchResult.uid === user.uid ? (
                  <span className="text-xs text-gray-400">自分</span>
                ) : friends.some(f => f.uid === searchResult.uid) ? (
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">友達</span>
                ) : requestSent ? (
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">申請済み</span>
                ) : (
                  <button
                    onClick={() => handleSendRequest((searchResult as SearchResult).uid)}
                    disabled={actionLoading === searchResult.uid}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors shrink-0"
                  >
                    申請
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 申請タブ */}
        {activeTab === 'requests' && (
          loadingRequests ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  </div>
                  <div className="h-9 w-16 bg-gray-200 rounded-xl" />
                  <div className="h-9 w-16 bg-gray-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <Users size={40} strokeWidth={1.5} />
              <p className="text-sm">新しい申請はありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-lg font-bold text-orange-500 shrink-0">
                    {req.photoUrl ? (
                      <img src={req.photoUrl} alt={req.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{req.displayName?.[0] ?? 'U'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{req.displayName}</p>
                  </div>
                  <button
                    onClick={() => handleAccept(req)}
                    disabled={actionLoading === req.id}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors shrink-0"
                  >
                    承認
                  </button>
                  <button
                    onClick={() => handleReject(req)}
                    disabled={actionLoading === req.id}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-60 transition-colors shrink-0"
                  >
                    却下
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* 友達タブ */}
        {activeTab === 'friends' && (
          loadingFriends ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <Users size={40} strokeWidth={1.5} />
              <p className="text-sm">まだ友達がいません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div key={friend.uid} className="bg-white rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-lg font-bold text-orange-500 shrink-0">
                    {friend.photoUrl ? (
                      <img src={friend.photoUrl} alt={friend.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{friend.displayName?.[0] ?? 'U'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{friend.displayName}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </div>
  )
}
