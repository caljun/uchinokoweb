'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { collection, addDoc, getDocs, query, limit, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import type { Dog } from '@/types/dog'
import { X, RotateCcw, Check, Loader2 } from 'lucide-react'

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

  const startCamera = useCallback(async () => {
    setCameraError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', aspectRatio: 3 / 4 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setCameraError(true)
    }
  }, [])

  useEffect(() => {
    startCamera()
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [startCamera])

  // 3:4にクロップして撮影
  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const vw = video.videoWidth
    const vh = video.videoHeight
    const targetAspect = 3 / 4

    let srcX = 0, srcY = 0, srcW = vw, srcH = vh
    const videoAspect = vw / vh

    if (videoAspect > targetAspect) {
      srcW = vh * targetAspect
      srcX = (vw - srcW) / 2
    } else {
      srcH = vw / targetAspect
      srcY = (vh - srcH) / 2
    }

    canvas.width = 900
    canvas.height = 1200
    canvas.getContext('2d')?.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, 900, 1200)
    setPhoto(canvas.toDataURL('image/jpeg', 0.85))
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const retake = () => {
    setPhoto(null)
    startCamera()
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
      // ファイルも3:4にクロップ
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
    <div className="fixed inset-0 bg-black flex flex-col" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
      >
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X size={20} className="text-white" />
        </button>
        <p className="text-white font-bold text-sm">今日の一枚</p>
        <div className="w-9" />
      </div>

      {photo ? (
        <>
          {/* 3:4プレビュー */}
          <div className="flex-1 flex items-center justify-center px-0 min-h-0">
            <div className="w-full aspect-[3/4] relative max-h-full">
              <Image src={photo} alt="preview" fill className="object-cover" />
            </div>
          </div>

          {/* コントロール */}
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
      ) : cameraError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
          <p className="text-white/60 text-center text-sm">
            カメラにアクセスできませんでした。<br />ライブラリから選んでください。
          </p>
          <label className="px-8 py-3 bg-orange-500 text-white rounded-full font-bold text-sm cursor-pointer">
            ライブラリから選ぶ
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </label>
        </div>
      ) : (
        <>
          {/* 3:4カメラプレビュー */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="w-full aspect-[3/4] relative overflow-hidden max-h-full bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {/* シャッター */}
          <div className="flex-shrink-0 py-8 flex items-center justify-center gap-10">
            <label className="flex flex-col items-center gap-1 cursor-pointer">
              <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 flex items-center justify-center">
                <span className="text-base">🖼️</span>
              </div>
              <span className="text-white/40 text-[10px]">ライブラリ</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
            <button
              onClick={capture}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 bg-white rounded-full" />
            </button>
            <div className="w-10" />
          </div>
        </>
      )}
    </div>
  )
}
