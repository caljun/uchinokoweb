'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { collection, addDoc, getDocs, query, limit, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { Dog } from '@/types/dog'
import { ChevronDown, RefreshCw, RotateCcw, Check, Loader2 } from 'lucide-react'

export default function PostPage() {
  const { user, owner } = useAuth()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [photo, setPhoto] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [myDog, setMyDog] = useState<Dog | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [cameraError, setCameraError] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  useEffect(() => {
    if (!user) { router.replace('/home'); return }
    getDocs(query(collection(db, 'owners', user.uid, 'dogs'), limit(1))).then(snap => {
      if (!snap.empty) {
        const d = snap.docs[0]
        const data = d.data()
        setMyDog({ id: d.id, ...data, birthDate: data.birthDate?.toDate?.() ?? new Date() } as Dog)
      }
    })
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    )
  }, [user, router])

  const startCamera = useCallback(async (mode: 'environment' | 'user' = 'environment') => {
    setCameraError(false)
    streamRef.current?.getTracks().forEach(t => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, aspectRatio: 3 / 4 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setCameraError(true)
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [startCamera, facingMode])

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const vw = video.videoWidth
    const vh = video.videoHeight
    const targetAspect = 3 / 4
    const videoAspect = vw / vh

    let sx = 0, sy = 0, sw = vw, sh = vh
    if (videoAspect > targetAspect) {
      sw = vh * targetAspect
      sx = (vw - sw) / 2
    } else {
      sh = vw / targetAspect
      sy = (vh - sh) / 2
    }

    canvas.width = 900
    canvas.height = 1200
    const ctx = canvas.getContext('2d')
    if (facingMode === 'user') {
      ctx?.translate(900, 0)
      ctx?.scale(-1, 1)
    }
    ctx?.drawImage(video, sx, sy, sw, sh, 0, 0, 900, 1200)
    setPhoto(canvas.toDataURL('image/jpeg', 0.85))
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const retake = () => {
    setPhoto(null)
    startCamera(facingMode)
  }

  const submit = async () => {
    if (!photo || !user || !myDog) return
    setSubmitting(true)
    try {
      const res = await fetch(photo)
      const blob = await res.blob()
      const sRef = storageRef(storage, `posts/${user.uid}/${Date.now()}.jpg`)
      await uploadBytes(sRef, blob)
      const imageUrl = await getDownloadURL(sRef)

      const birthDate = myDog.birthDate instanceof Date
        ? myDog.birthDate.toISOString()
        : String(myDog.birthDate)

      await addDoc(collection(db, 'posts'), {
        ownerId: user.uid,
        dogId: myDog.id ?? '',
        dogName: myDog.name,
        dogBreed: myDog.breed,
        dogBreedSize: myDog.breedSize,
        dogBirthDate: birthDate,
        dogPhotoUrl: myDog.photoUrl ?? null,
        ownerDisplayName: owner?.displayName ?? '',
        imageUrl,
        caption: caption.trim(),
        location: location ?? { lat: 0, lng: 0 },
        postedAt: serverTimestamp(),
        isLate: false,
      })

      router.replace('/home')
    } catch (e) {
      console.error(e)
      setSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const targetAspect = 3 / 4
        const imgAspect = img.width / img.height
        let sx = 0, sy = 0, sw = img.width, sh = img.height
        if (imgAspect > targetAspect) {
          sw = img.height * targetAspect
          sx = (img.width - sw) / 2
        } else {
          sh = img.width / targetAspect
          sy = (img.height - sh) / 2
        }
        canvas.width = 900
        canvas.height = 1200
        canvas.getContext('2d')?.drawImage(img, sx, sy, sw, sh, 0, 0, 900, 1200)
        setPhoto(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div
      className="fixed inset-0 bg-black flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* ヘッダー */}
      <div className="flex items-center px-4 py-3 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ChevronDown size={22} className="text-white" />
        </button>
        <p className="flex-1 text-center text-white font-black text-lg tracking-tight">
          uchinoko<span className="text-orange-500">.</span>
        </p>
        <div className="w-10" />
      </div>

      {photo ? (
        /* ── プレビュー ── */
        <>
          <div className="flex-1 flex items-center px-3 min-h-0">
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-black">
              <Image src={photo} alt="preview" fill className="object-cover" />
              {/* 犬プロフインセット */}
              {myDog?.photoUrl && (
                <div className="absolute top-3 left-3 w-24 aspect-[3/4] rounded-xl overflow-hidden border-2 border-white shadow-lg">
                  <Image src={myDog.photoUrl} alt="" fill className="object-cover" sizes="96px" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 px-4 py-4 space-y-3">
            <input
              type="text"
              placeholder="コメントを追加..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              maxLength={100}
              className="w-full bg-white/10 text-white placeholder-white/40 rounded-2xl px-4 py-3 text-sm focus:outline-none"
            />
            <div className="flex gap-3">
              <button
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/10 rounded-2xl text-white text-sm font-medium"
              >
                <RotateCcw size={16} />
                撮り直す
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-orange-500 rounded-2xl text-white font-bold disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                投稿する
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ── カメラ ── */
        <div className="flex-1 flex flex-col justify-center px-3 pb-6">
          {/* ビューファインダー 3:4 */}
          <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden bg-gray-900">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <p className="text-white/50 text-sm text-center px-8">カメラにアクセスできませんでした</p>
                <label className="px-6 py-2.5 bg-white/10 text-white rounded-full text-sm font-medium cursor-pointer">
                  ライブラリから選ぶ
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                </label>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={facingMode === 'user' ? { transform: 'scaleX(-1)' } : {}}
              />
            )}

            {/* カメラ切り替え */}
            {!cameraError && (
              <button
                onClick={flipCamera}
                className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
              >
                <RefreshCw size={18} className="text-white" />
              </button>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* シャッター */}
          <div className="flex items-center justify-center mt-6">
            <button
              onClick={capture}
              disabled={cameraError}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-30"
            >
              <div className="w-[60px] h-[60px] bg-white rounded-full" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
