'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { collection, query, where, orderBy, getDocs, limit, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { Post, Dog } from '@/types/dog'
import { scorePost, timeAgo } from '@/lib/postUtils'
import { Search, PawPrint } from 'lucide-react'

function PostGridCard({ post }: { post: Post }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="relative aspect-square bg-gray-900 cursor-pointer" onClick={() => setExpanded(v => !v)}>
      <Image src={post.imageUrl} alt={post.dogName} fill className="object-cover" sizes="50vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-xs font-bold truncate">{post.dogName}</p>
        <p className="text-white/60 text-[10px] truncate">{post.dogBreed}</p>
      </div>

      {expanded && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-start justify-end p-3 gap-1">
          <div className="flex items-center gap-2 w-full">
            {post.dogPhotoUrl ? (
              <div className="w-7 h-7 rounded-full overflow-hidden border border-white flex-shrink-0">
                <Image src={post.dogPhotoUrl} alt="" width={28} height={28} className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0">
                <PawPrint size={12} className="text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{post.dogName}</p>
              <p className="text-white/50 text-[10px] truncate">{post.ownerDisplayName}</p>
            </div>
          </div>
          {post.caption && <p className="text-white/80 text-[10px] line-clamp-2">{post.caption}</p>}
          <p className="text-white/40 text-[10px]">{timeAgo(post.postedAt)}</p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [myDog, setMyDog] = useState<Dog | null>(null)
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [])

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), limit(1))).then(snap => {
      if (!snap.empty) {
        const d = snap.docs[0]
        const data = d.data()
        setMyDog({ id: d.id, ...data, birthDate: data.birthDate?.toDate?.() ?? new Date() } as Dog)
      }
    })
  }, [user])

  useEffect(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    getDocs(query(
      collection(db, 'posts'),
      where('postedAt', '>=', Timestamp.fromDate(todayStart)),
      orderBy('postedAt', 'desc')
    )).then(snap => {
      setPosts(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        postedAt: d.data().postedAt?.toDate?.() ?? new Date(),
      })) as Post[])
      setLoading(false)
    })
  }, [])

  const filtered = posts.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return p.dogBreed.toLowerCase().includes(q) || p.dogName.toLowerCase().includes(q)
  })

  const scored = filtered
    .map(p => ({ post: p, score: scorePost(p, myDog, myLocation) }))
    .sort((a, b) => b.score - a.score || b.post.postedAt.getTime() - a.post.postedAt.getTime())

  return (
    <div className="min-h-screen bg-black pb-28">
      <div className="px-4 pt-4 pb-3 sticky top-16 bg-black z-10">
        <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3">
          <Search size={16} className="text-white/40 flex-shrink-0" />
          <input
            type="text"
            placeholder="犬種・名前で検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/40 text-sm focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : scored.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-2 px-8">
          <PawPrint size={36} className="text-white/20" strokeWidth={1.5} />
          <p className="text-white/40 text-sm text-center">
            {searchQuery ? `「${searchQuery}」の投稿は見つかりませんでした` : '今日の投稿はまだありません'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px">
          {scored.map(({ post }) => (
            <PostGridCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
