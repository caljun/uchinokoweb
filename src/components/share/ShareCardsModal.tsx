'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { X, Share2, Loader2 } from 'lucide-react'
import { Dog } from '@/types/dog'
import { getBreedDescription, getAgeDisplayText, getCatAgeDisplayText } from '@/lib/diagnosis'

const CARD_W = 540
const CARD_H = 720
const FONT = '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif'
const LP_URL = 'https://uchinoko-lp.vercel.app/'

type Props = {
  dog: Dog
  onClose: () => void
}

export function ShareCardsModal({ dog, onClose }: Props) {
  const card1Ref = useRef<HTMLDivElement>(null) // 写真（共通）
  const card2Ref = useRef<HTMLDivElement>(null) // 基本情報（共通）
  const card3Ref = useRef<HTMLDivElement>(null) // タイプ＋犬種（犬のみ）
  const card4Ref = useRef<HTMLDivElement>(null) // 詳細説明（犬のみ）
  const card5Ref = useRef<HTMLDivElement>(null) // QR（共通）

  const [photoSrc, setPhotoSrc] = useState<string>('')
  const [qrSrc, setQrSrc] = useState<string>('')
  const [cardUrls, setCardUrls] = useState<string[]>([])
  const [cardFiles, setCardFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)

  const isCat = dog.petType === 'cat'
  const ageLabel = isCat ? getCatAgeDisplayText(dog.birthDate) : getAgeDisplayText(dog.birthDate, dog.breedSize)
  const genderLabel = dog.gender === 'male' ? 'オス' : 'メス'
  const genderFull = dog.neutered ? `${genderLabel}（去勢・避妊済み）` : genderLabel

  const typeDesc = (!isCat && dog.temperamentType) ? (({
    リーダータイプ: '知恵があり勇敢なまとめ役タイプです。\n犬社会と人間社会での自分の役割を理解しており、人の役に立ちたいと思っています。\n仕事を与えて達成感を味わわせてあげましょう。',
    右腕タイプ: '活発で楽観的、好奇心旺盛なタイプです。\n目立つ失敗をすることもありますが、リーダータイプの犬や人のもとで能力が向上します。\n運動と刺激をしっかり与えてあげましょう。',
    市民タイプ: '遊びを通して序列確認をし合って過ごすタイプです。\n遊びがヒートアップしてケンカになりやすいですが、社交性があり比較的飼いやすいです。\n適度な遊び相手を見つけてあげましょう。',
    守られタイプ: '特定の人になつきやすく、その他の人には人見知りをするタイプです。\nいつも抱っこされていたいと思っています。\n環境の変化は苦手なので、社会化を意識して取り組みましょう。',
  } as Record<string, string>)[dog.temperamentType] ?? '') : ''
  const breedInfo = !isCat ? getBreedDescription(dog.breed) : { origin: '', purpose: '', pros: '', cons: '', chip: '' }
  const diffParagraphs = !isCat ? (dog.difficultyDescription ?? '').split('\n\n').filter(Boolean) : []

  useEffect(() => {
    if (!dog.photoUrl) { setPhotoSrc(''); return }
    fetch(`/api/image-proxy?url=${encodeURIComponent(dog.photoUrl)}`)
      .then((r) => r.blob())
      .then((blob) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      }))
      .then(setPhotoSrc)
      .catch(() => setPhotoSrc(''))
  }, [dog.photoUrl])

  useEffect(() => {
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(LP_URL, { width: 300, margin: 2, color: { dark: '#1f2937', light: '#ffffff' } })
        .then(setQrSrc)
        .catch(() => setQrSrc(''))
    })
  }, [])

  const photoReady = (!dog.photoUrl || photoSrc !== '') && qrSrc !== ''

  const generateCards = useCallback(async () => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 300))
      const html2canvas = (await import('html2canvas')).default

      // 猫: card1, card2, card5 / 犬: card1, card2, card3, card4, card5
      const refs = isCat
        ? [card1Ref, card2Ref, card5Ref]
        : [card1Ref, card2Ref, card3Ref, card4Ref, card5Ref]

      const urls: string[] = []
      const files: File[] = []

      for (let i = 0; i < refs.length; i++) {
        const el = refs[i].current
        if (!el) continue

        await Promise.all(
          Array.from(el.querySelectorAll('img')).map((img) => {
            if (img.complete) return Promise.resolve()
            return new Promise<void>((resolve) => {
              img.onload = () => resolve()
              img.onerror = () => resolve()
            })
          })
        )

        const originalTransform = el.style.transform
        const originalTransformOrigin = el.style.transformOrigin
        const contentHeight = el.scrollHeight
        if (contentHeight > CARD_H) {
          const scale = CARD_H / contentHeight
          el.style.transformOrigin = 'top left'
          el.style.transform = `scale(${scale})`
        }

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          width: CARD_W,
          height: CARD_H,
        })

        el.style.transform = originalTransform
        el.style.transformOrigin = originalTransformOrigin

        urls.push(canvas.toDataURL('image/png', 0.95))
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png', 0.95)
        )
        files.push(new File([blob], `${dog.name}_card${i + 1}.png`, { type: 'image/png' }))
      }

      setCardUrls(urls)
      setCardFiles(files)
    } finally {
      setLoading(false)
    }
  }, [dog.name, isCat])

  useEffect(() => {
    if (!photoReady) return
    generateCards()
  }, [photoReady, generateCards])

  const shareFiles = async (files: File[]) => {
    if (files.length === 0) return
    setSharing(true)
    try {
      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({ files, title: `${dog.name}のシェアカード` })
      } else {
        for (const file of files) {
          const url = URL.createObjectURL(file)
          const a = document.createElement('a')
          a.download = file.name
          a.href = url
          a.click()
          URL.revokeObjectURL(url)
          await new Promise((r) => setTimeout(r, 300))
        }
      }
    } finally {
      setSharing(false)
    }
  }

  const handleShareCurrent = () => shareFiles([cardFiles[currentCard]])
  const handleShareAll = () => shareFiles(cardFiles)

  const baseCard: React.CSSProperties = {
    width: CARD_W,
    height: CARD_H,
    fontFamily: FONT,
    boxSizing: 'border-box',
    overflow: 'hidden',
    borderRadius: 0,
    position: 'relative',
    flexShrink: 0,
  }

  const cardCount = isCat ? 3 : 5

  // 基本情報のタイルスタイル（スライドのSummaryTileに合わせる）
  const infoTile = (icon: string, label: string, value: string) => (
    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 18px', borderRadius: 13, border: '1px solid #f3f4f6', backgroundColor: 'rgba(249,250,251,0.8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ fontSize: 23 }}>{icon}</span>
        <span style={{ fontSize: 21, color: '#9ca3af' }}>{label}</span>
      </div>
      <p style={{ fontSize: 22, fontWeight: 600, color: '#1f2937', margin: 0, textAlign: 'right', maxWidth: '60%', lineHeight: 1.3 }}>{value}</p>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="font-bold text-gray-900 text-base">シェアカード</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {loading ? '画像を生成中...' : 'iOSは長押しでも保存できます'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-orange-400" />
          </div>
        ) : (
          <>
            {/* カードプレビュー */}
            <div className="px-5 pb-3">
              <div className="relative flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardUrls[currentCard]}
                  alt={`カード${currentCard + 1}`}
                  className="rounded-2xl shadow-md"
                  style={{ height: 300, width: 'auto' }}
                />
                {currentCard > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentCard((p) => p - 1)}
                    className="absolute left-0 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-600 text-lg"
                  >‹</button>
                )}
                {currentCard < cardUrls.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentCard((p) => p + 1)}
                    className="absolute right-0 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-600 text-lg"
                  >›</button>
                )}
              </div>
              {/* ドット */}
              <div className="flex justify-center gap-1.5 mt-3">
                {cardUrls.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentCard(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === currentCard ? 'bg-orange-500' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>

            {/* ボタン */}
            <div className="px-5 pb-8 flex flex-col gap-2">
              <button
                onClick={handleShareCurrent}
                disabled={sharing}
                className="w-full py-3.5 bg-orange-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-60"
              >
                {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                このカードをシェア
              </button>
              <button
                onClick={handleShareAll}
                disabled={sharing}
                className="w-full py-2.5 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors disabled:opacity-40"
              >
                {cardCount}枚まとめて保存
              </button>
            </div>
          </>
        )}
      </div>

      {/* ───── オフスクリーンカード ───── */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', pointerEvents: 'none' }}>

        {/* CARD 1: 写真（共通） */}
        <div ref={card1Ref} style={{ ...baseCard, backgroundColor: '#FFF7ED' }}>
          {(photoSrc || dog.photoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc || dog.photoUrl}
              alt={dog.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 96, color: '#fed7aa' }}>
              {isCat ? '🐱' : '🐾'}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', padding: '100px 36px 44px' }}>
            <p style={{ color: 'white', fontSize: 46, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{dog.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 22, margin: '8px 0 0', fontWeight: 500 }}>
              {ageLabel} ・ {genderLabel} ・ {isCat ? (dog.coatPattern ?? dog.breed) : dog.breed}
            </p>
          </div>
          <div style={{ position: 'absolute', top: 28, left: 32 }}>
            <p style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.5)', letterSpacing: '0.02em' }}>ウチの子</p>
          </div>
        </div>

        {/* CARD 2: 基本情報（共通） */}
        <div ref={card2Ref} style={{ ...baseCard, backgroundColor: '#F2F2F7', padding: '88px 48px 48px' }}>
          <div style={{ position: 'absolute', top: 28, left: 32 }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#f97316', margin: 0, letterSpacing: '0.02em' }}>ウチの子</p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '22px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: 20, color: '#9ca3af', margin: '0 0 16px', fontWeight: 600, letterSpacing: '0.05em' }}>基本情報</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {infoTile('🏷️', '名前', dog.name)}
              {infoTile('📅', '年齢', ageLabel)}
              {infoTile('⚥', '性別', genderFull)}
              {infoTile('⚖️', '体重', `${dog.weight} kg`)}
              {isCat
                ? infoTile('🐱', '毛色・柄', dog.coatPattern ?? dog.breed)
                : infoTile('🐶', '犬種', dog.breed)
              }
            </div>
          </div>
        </div>

        {/* CARD 3: タイプ＋犬種の特徴（犬のみ） */}
        {!isCat && (
          <div ref={card3Ref} style={{ ...baseCard, backgroundColor: '#F2F2F7', padding: '88px 48px 48px' }}>
            <div style={{ position: 'absolute', top: 28, left: 32 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#f97316', margin: 0, letterSpacing: '0.02em' }}>ウチの子</p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '20px 24px', marginBottom: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: 18, color: '#9ca3af', margin: '0 0 6px' }}>性格タイプ</p>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#1f2937', margin: '0 0 10px' }}>{dog.temperamentType}</p>
              {typeDesc && (
                <p style={{ fontSize: 19, color: '#6b7280', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{typeDesc}</p>
              )}
            </div>

            {(breedInfo.origin || breedInfo.purpose || breedInfo.pros || breedInfo.cons || breedInfo.chip) && (
              <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '16px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
                <p style={{ fontSize: 18, color: '#9ca3af', margin: '0 0 12px', fontWeight: 600, letterSpacing: '0.05em' }}>犬種の特徴</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ fontSize: 20, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>【{dog.breed}の特徴】</p>
                  {breedInfo.origin && <p style={{ fontSize: 18, color: '#6b7280', margin: 0 }}>原産国: {breedInfo.origin}</p>}
                  {breedInfo.purpose && <p style={{ fontSize: 18, color: '#6b7280', margin: 0 }}>目的: {breedInfo.purpose}</p>}
                  {breedInfo.pros && <p style={{ fontSize: 18, color: '#6b7280', margin: 0 }}>長所: {breedInfo.pros}</p>}
                  {breedInfo.cons && <p style={{ fontSize: 18, color: '#6b7280', margin: 0 }}>短所: {breedInfo.cons}</p>}
                  {breedInfo.chip && <p style={{ fontSize: 18, color: '#6b7280', margin: '6px 0 0', whiteSpace: 'pre-line' }}>{breedInfo.chip}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CARD 4: 詳細説明（犬のみ） */}
        {!isCat && (
          <div ref={card4Ref} style={{ ...baseCard, backgroundColor: '#F2F2F7', padding: '88px 48px 48px' }}>
            <div style={{ position: 'absolute', top: 28, left: 32 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#f97316', margin: 0, letterSpacing: '0.02em' }}>ウチの子</p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: 18, color: '#9ca3af', margin: '0 0 16px', fontWeight: 600, letterSpacing: '0.05em' }}>詳細説明</p>
              <div>
                {diffParagraphs.slice(0, 4).map((p, i) => (
                  <p key={i} style={{ fontSize: 20, color: '#6b7280', lineHeight: 1.8, margin: i > 0 ? '12px 0 0' : '0' }}>
                    {p.replace(/\n/g, '')}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CARD 5(犬) / CARD 3(猫): QR */}
        <div ref={card5Ref} style={{ ...baseCard, background: 'linear-gradient(145deg, #FF8F0D 0%, #f97316 40%, #ea580c 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 36, fontWeight: 800, color: 'white', margin: 0, letterSpacing: '0.04em' }}>ウチの子</p>
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)', margin: '10px 0 0', fontWeight: 500 }}>
              {isCat ? '愛猫のすべてをここに' : '愛犬のすべてをここに'}
            </p>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: 24, padding: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', marginBottom: 36 }}>
            {qrSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt="QR" style={{ width: 220, height: 220, display: 'block' }} />
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'white', margin: '0 0 12px', lineHeight: 1.6 }}>
              QRコードを読み取って、<br />ウチの子をはじめよう！
            </p>
            {!isCat && (
              <p style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.7 }}>愛犬の実年齢がわかるよ！</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
