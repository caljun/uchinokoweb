'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { collection, query, where, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import type { Post, Dog } from '@/types/dog'
import { scorePost, timeAgo } from '@/lib/postUtils'
import { Lock, PawPrint } from 'lucide-react'

const DUMMY_POSTS: Post[] = [
  {
    id: 'dummy-1',
    ownerId: 'dummy',
    dogId: 'dummy-1',
    dogName: 'むぎ',
    dogBreed: '柴犬',
    dogBreedSize: 0,
    dogBirthDate: '2021-04-15',
    ownerDisplayName: 'たろう',
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&h=1200&fit=crop',
    caption: '今日もお散歩気持ちよかった🐾',
    location: { lat: 35.6762, lng: 139.6503 },
    postedAt: new Date(Date.now() - 1000 * 60 * 23),
    isLate: false,
  },
  {
    id: 'dummy-2',
    ownerId: 'dummy',
    dogId: 'dummy-2',
    dogName: 'ちょこ',
    dogBreed: 'トイプードル',
    dogBreedSize: 0,
    dogBirthDate: '2022-08-03',
    ownerDisplayName: 'はなこ',
    imageUrl: 'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=900&h=1200&fit=crop',
    caption: '',
    location: { lat: 35.6895, lng: 139.6917 },
    postedAt: new Date(Date.now() - 1000 * 60 * 47),
    isLate: false,
  },
  {
    id: 'dummy-3',
    ownerId: 'dummy',
    dogId: 'dummy-3',
    dogName: 'ごろう',
    dogBreed: 'ゴールデンレトリバー',
    dogBreedSize: 2,
    dogBirthDate: '2020-01-20',
    ownerDisplayName: 'けんじ',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=900&h=1200&fit=crop',
    caption: '公園で友達できた！',
    location: { lat: 35.6580, lng: 139.7016 },
    postedAt: new Date(Date.now() - 1000 * 60 * 91),
    isLate: true,
  },
]

function PostCard({ post, locked, onUnlock }: { post: Post; locked: boolean; onUnlock: () => void }) {
  return (
    <div className="px-3 pt-4 pb-2">
      {/* 投稿者ヘッダー */}
      <div className="flex items-center gap-2.5 mb-2.5 px-1">
        {post.dogPhotoUrl ? (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
            <Image src={post.dogPhotoUrl} alt="" width={32} height={32} className="object-cover w-full h-full" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
            <PawPrint size={14} className="text-gray-400" />
          </div>
        )}
        <div>
          <p className="text-gray-900 font-bold text-sm leading-tight">{post.dogName}</p>
          <p className="text-gray-500 text-xs">{timeAgo(post.postedAt)}</p>
        </div>
        {post.isLate && (
          <span className="ml-auto text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">遅れ</span>
        )}
      </div>

      {/* 画像 */}
      <div className="rounded-2xl overflow-hidden aspect-[3/4] relative bg-gray-100">
        <Image
          src={post.imageUrl}
          alt={post.dogName}
          fill
          className={`object-cover transition-all duration-300 ${locked ? 'blur-2xl scale-110' : ''}`}
          sizes="100vw"
        />

        {/* 犬プロフ小インセット */}
        {!locked && post.dogPhotoUrl && (
          <div className="absolute top-3 left-3 w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 border-white shadow-lg">
            <Image src={post.dogPhotoUrl} alt="" fill className="object-cover" sizes="96px" />
          </div>
        )}

        {/* ロックオーバーレイ */}
        {locked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/10">
            <Lock size={26} className="text-white drop-shadow" />
            <p className="text-white text-sm font-bold drop-shadow">投稿すると見られます</p>
            <button
              onClick={onUnlock}
              className="px-6 py-2 bg-orange-500 text-white rounded-full font-bold text-sm shadow"
            >
              撮影する
            </button>
          </div>
        )}
      </div>

      {/* キャプション */}
      <div className="flex items-center gap-2.5 mt-2.5 px-1">
        {post.dogPhotoUrl ? (
          <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
            <Image src={post.dogPhotoUrl} alt="" width={24} height={24} className="object-cover w-full h-full" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0" />
        )}
        {post.caption ? (
          <p className="text-gray-800 text-sm">{post.caption}</p>
        ) : (
          <p className="text-gray-400 text-sm">コメントを追加...</p>
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [hasPostedToday, setHasPostedToday] = useState<boolean | null>(null)
  const [myDog, setMyDog] = useState<Dog | null>(null)
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const load = async () => {
      const dogsSnap = await getDocs(query(collection(db, 'owners', user.uid, 'dogs'), limit(1)))
      if (!dogsSnap.empty) {
        const d = dogsSnap.docs[0]
        const data = d.data()
        setMyDog({ id: d.id, ...data, birthDate: data.birthDate?.toDate?.() ?? new Date() } as Dog)
      }

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [myPostsSnap, allPostsSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'posts'),
          where('ownerId', '==', user.uid),
          where('postedAt', '>=', Timestamp.fromDate(todayStart))
        )),
        getDocs(query(
          collection(db, 'posts'),
          where('postedAt', '>=', Timestamp.fromDate(todayStart)),
          orderBy('postedAt', 'desc')
        )),
      ])

      setHasPostedToday(!myPostsSnap.empty)
      setPosts(allPostsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        postedAt: d.data().postedAt?.toDate?.() ?? new Date(),
      })) as Post[])
      setLoading(false)
    }
    load()
  }, [user])

  const scoredPosts = [...posts]
    .map(p => ({ post: p, score: scorePost(p, myDog, myLocation) }))
    .sort((a, b) => b.score - a.score || b.post.postedAt.getTime() - a.post.postedAt.getTime())

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-8 gap-5">
        <PawPrint size={48} className="text-orange-500" strokeWidth={1.5} />
        <p className="text-gray-500 text-center text-sm">ログインして今日のうちの子を見よう</p>
        <button
          type="button"
          onClick={openAuthModal}
          className="px-8 py-3 bg-orange-500 text-white rounded-full font-bold text-sm"
        >
          ログイン / 新規登録
        </button>
      </div>
    )
  }

  const displayPosts = scoredPosts.length > 0 ? scoredPosts.map(s => s.post) : DUMMY_POSTS

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {displayPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          locked={!hasPostedToday}
          onUnlock={() => router.push('/post')}
        />
      ))}
    </div>
  )
}
