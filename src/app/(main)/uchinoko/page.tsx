'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, query, orderBy, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { Dog } from '@/types/dog'
import { Plus, PawPrint, ChevronRight, X, Camera, Star, Trophy } from 'lucide-react'

type WelcomeState = 'idle' | 'uploading' | 'success'

export default function UchinokoPage() {
  return (
    <Suspense>
      <UchinokoContent />
    </Suspense>
  )
}

function UchinokoContent() {
  const { user } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [showPetModal, setShowPetModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // ウェルカムモーダル
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeState, setWelcomeState] = useState<WelcomeState>('idle')
  const [welcomeDogId, setWelcomeDogId] = useState('')
  const [welcomeDogName, setWelcomeDogName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        setDogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dog)))
        setLoading(false)
        if (searchParams.get('welcome') === '1' && !snap.empty) {
          const d = snap.docs[0]
          setWelcomeDogId(d.id)
          setWelcomeDogName(d.data().name ?? '')
          setShowWelcome(true)
        }
      })
  }, [user, searchParams])

  const handleMissionPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !welcomeDogId) return
    e.target.value = ''
    setWelcomeState('uploading')
    try {
      const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
      const storageRef = ref(storage, `owners/${user.uid}/dogs/${welcomeDogId}/missionPhotos/${today}_photo_post.jpg`)
      await uploadBytes(storageRef, file)
      const photoUrl = await getDownloadURL(storageRef)
      await setDoc(doc(collection(db, 'owners', user.uid, 'dogs', welcomeDogId, 'diaries')), {
        photos: [photoUrl],
        comment: 'ミッション達成！「今日の一枚」',
        dogId: welcomeDogId,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      })
      setWelcomeState('success')
    } catch {
      setWelcomeState('idle')
    }
  }

  const closeWelcome = (dest?: string) => {
    setShowWelcome(false)
    router.replace('/uchinoko')
    if (dest) router.push(dest)
  }

  const getAgeLabel = (pet: Dog) => {
    const catLabels = ['子猫期', '成猫期', 'シニア期']
    const dogLabels = ['パピー期', '成犬期', 'シニア期']
    const labels = pet.petType === 'cat' ? catLabels : dogLabels
    return labels[pet.ageGroup ?? 1] ?? labels[1]
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col items-center justify-center py-20 px-5 gap-5">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <PawPrint size={40} strokeWidth={1.5} className="text-gray-300" />
          </div>
          <p className="text-gray-500 text-center text-sm">ログインするとウチの子を登録できます</p>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full max-w-xs py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
          >
            ログイン / 新規登録
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 lg:px-10 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowPetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors"
            >
              <Plus size={16} />
              <span>登録する</span>
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : dogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
              <PawPrint size={48} strokeWidth={1.5} />
              <p className="text-gray-500 text-center">まだウチの子が登録されていません</p>
              <button
                onClick={() => setShowPetModal(true)}
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors text-sm"
              >
                最初の子を登録する
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dogs.map((dog) => (
                <Link key={dog.id} href={`/uchinoko/${dog.id}`}>
                  <div className="bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-[3/4] bg-orange-50 relative">
                      {dog.photoUrl ? (
                        <Image src={dog.photoUrl} alt={dog.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PawPrint size={36} className="text-orange-200" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-800 text-sm truncate">{dog.name}</p>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {getAgeLabel(dog)} ・ {dog.gender === 'male' ? 'オス' : 'メス'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ペット種別選択モーダル */}
      {showPetModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6"
          onClick={() => setShowPetModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">ウチの子はどっち？</h2>
              <button onClick={() => setShowPetModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPetModal(false); router.push('/uchinoko/new') }}
                className="flex-1 flex flex-col items-center gap-2 py-6 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
              >
                <span className="text-4xl">🐶</span>
                <span className="font-bold text-gray-800">犬</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ウェルカムモーダル */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            {welcomeState === 'success' ? (
              <div className="p-7 flex flex-col items-center text-center">
                <div className="text-5xl mb-3 animate-bounce">🎉</div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">ミッションクリア！</h2>
                <div className="flex items-center gap-1.5 mt-1 mb-6">
                  <Star size={16} className="text-orange-400" fill="currentColor" />
                  <span className="text-lg font-black text-orange-500">+10ポイント獲得！</span>
                </div>
                <div className="w-full bg-orange-50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy size={16} className="text-orange-500" />
                    <p className="text-sm font-bold text-orange-500">ランキングとは？</p>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed text-center">
                    ミッションをこなすごとにポイントが貯まり、<span className="font-bold">毎週リセット</span>されるランキングで順位が決まります。
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mt-2 text-center">
                    毎日ミッションをこなして、<span className="font-bold">ウチの子を1位</span>にしよう！
                  </p>
                </div>
                <button
                  onClick={() => closeWelcome('/ranking')}
                  className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition-colors"
                >
                  ランキングを見る →
                </button>
                <button
                  onClick={() => closeWelcome('/missions')}
                  className="w-full py-2.5 text-gray-400 text-sm mt-2"
                >
                  ミッションをもっとやる
                </button>
              </div>
            ) : (
              <div className="p-7 flex flex-col items-center text-center">
                <div className="text-5xl mb-3">📸</div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">登録完了！</h2>
                <p className="text-gray-500 text-sm mb-6">
                  {welcomeDogName ? `${welcomeDogName}の写真を撮って` : ''}さっそく最初のミッションをやってみよう
                </p>
                <div className="w-full bg-orange-50 rounded-2xl p-4 mb-6 text-left">
                  <p className="text-xs text-orange-400 font-bold mb-2">最初のミッション</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📸</span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">今日の一枚を撮る</p>
                      <p className="text-xs text-gray-500 mt-0.5">どんな写真でもOK！</p>
                      <p className="text-xs text-orange-500 font-bold mt-0.5">+10ポイント</p>
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleMissionPhoto}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={welcomeState === 'uploading'}
                  className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {welcomeState === 'uploading' ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      アップロード中...
                    </>
                  ) : (
                    <>
                      <Camera size={16} />
                      {welcomeDogName ? `${welcomeDogName}の写真を撮る` : '写真を撮る'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => closeWelcome()}
                  disabled={welcomeState === 'uploading'}
                  className="w-full py-2.5 text-gray-400 text-sm mt-2 disabled:opacity-40"
                >
                  あとで
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
