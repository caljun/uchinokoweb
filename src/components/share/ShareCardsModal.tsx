'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { X, Share2, Loader2 } from 'lucide-react'
import { Dog } from '@/types/dog'
import { getBreedDescription, getAgeDisplayText } from '@/lib/diagnosis'

const CARD_W = 540
const CARD_H = 720
const FONT = '-apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic", sans-serif'

type Props = {
  dog: Dog
  onClose: () => void
}

export function ShareCardsModal({ dog, onClose }: Props) {
  const card1Ref = useRef<HTMLDivElement>(null)
  const card2Ref = useRef<HTMLDivElement>(null)
  const card3Ref = useRef<HTMLDivElement>(null)

  const [photoSrc, setPhotoSrc] = useState<string>('')
  const [cardUrls, setCardUrls] = useState<string[]>([])
  const [cardFiles, setCardFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  const ageLabel = getAgeDisplayText(dog.birthDate, dog.breedSize)
  const genderLabel = dog.gender === 'male' ? 'オス' : 'メス'
  const genderFull = dog.neutered ? `${genderLabel}（去勢・避妊済み）` : genderLabel
  const typeDesc = dog.temperamentType ? (({
    リーダータイプ: '知恵があり勇敢なまとめ役タイプです。\n犬社会と人間社会での自分の役割を理解しており、人の役に立ちたいと思っています。\n仕事を与えて達成感を味わわせてあげましょう。',
    右腕タイプ: '活発で楽観的、好奇心旺盛なタイプです。\n目立つ失敗をすることもありますが、リーダータイプの犬や人のもとで能力が向上します。\n運動と刺激をしっかり与えてあげましょう。',
    市民タイプ: '遊びを通して序列確認をし合って過ごすタイプです。\n遊びがヒートアップしてケンカになりやすいですが、社交性があり比較的飼いやすいです。\n適度な遊び相手を見つけてあげましょう。',
    守られタイプ: '特定の人になつきやすく、その他の人には人見知りをするタイプです。\nいつも抱っこされていたいと思っています。\n環境の変化は苦手なので、社会化を意識して取り組みましょう。',
  } as Record<string, string>)[dog.temperamentType] ?? '') : ''
  const breedInfo = getBreedDescription(dog.breed)
  const diffParagraphs = (dog.difficultyDescription ?? '').split('\n\n').filter(Boolean)

  // Step1: 犬の写真を base64 に変換
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

  // Step2: 写真の準備ができたらカード生成（バックグラウンド）
  const photoReady = !dog.photoUrl || photoSrc !== ''

  const generateCards = useCallback(async () => {
    setLoading(true)
    try {
      // DOM が描画されるのを待つ
      await new Promise((r) => setTimeout(r, 300))
      const html2canvas = (await import('html2canvas')).default
      const refs = [card1Ref, card2Ref, card3Ref]
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
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          width: CARD_W,
          height: CARD_H,
        })
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
  }, [dog.name])

  useEffect(() => {
    if (!photoReady) return
    generateCards()
  }, [photoReady, generateCards])

  // ボタン押下時は既にファイルが揃っているので即 share → iOS ジェスチャー制限を回避
  const handleShare = async () => {
    if (cardFiles.length === 0) return
    setSharing(true)
    try {
      if (navigator.canShare && navigator.canShare({ files: cardFiles })) {
        await navigator.share({ files: cardFiles, title: `${dog.name}のシェアカード` })
      } else {
        // デスクトップ fallback: ダウンロード
        for (const file of cardFiles) {
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

  const baseCard: React.CSSProperties = {
    width: CARD_W,
    height: CARD_H,
    fontFamily: FONT,
    boxSizing: 'border-box',
    overflow: 'hidden',
    borderRadius: 32,
    position: 'relative',
    flexShrink: 0,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden">
        {/* ヘッダー */}
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

        {/* カードプレビュー */}
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 size={32} className="animate-spin text-orange-400" />
          </div>
        ) : (
          <div className="px-5 pb-4 flex gap-3 overflow-x-auto">
            {cardUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`カード${i + 1}`}
                className="shrink-0 rounded-xl shadow-sm"
                style={{ height: 160, width: 'auto' }}
              />
            ))}
          </div>
        )}

        {/* シェアボタン */}
        <div className="px-5 pb-8">
          <button
            onClick={handleShare}
            disabled={loading || sharing || cardFiles.length === 0}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {sharing ? (
              <><Loader2 size={16} className="animate-spin" />シェア中...</>
            ) : (
              <><Share2 size={16} />3枚まとめてシェア・保存</>
            )}
          </button>
        </div>
      </div>

      {/* ───── オフスクリーンカード（html2canvas 用） ───── */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', pointerEvents: 'none' }}>

        {/* CARD 1: Photo */}
        <div ref={card1Ref} style={{ ...baseCard, backgroundColor: '#FFF7ED' }}>
          {(photoSrc || dog.photoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc || dog.photoUrl}
              alt={dog.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 96, color: '#fed7aa' }}>🐾</div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', padding: '100px 36px 44px' }}>
            <p style={{ color: 'white', fontSize: 46, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{dog.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 22, margin: '8px 0 0', fontWeight: 500 }}>
              {ageLabel} ・ {genderLabel} ・ {dog.breed}
            </p>
          </div>
          <div style={{ position: 'absolute', top: 28, right: 32 }}>
            <p style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.5)', letterSpacing: '0.02em' }}>ウチの子</p>
          </div>
        </div>

        {/* CARD 2: Info */}
        <div ref={card2Ref} style={{ ...baseCard, backgroundColor: '#F2F2F7', padding: '36px' }}>
          {/* App branding */}
          <p style={{ fontSize: 18, fontWeight: 700, color: '#f97316', margin: '0 0 16px', letterSpacing: '0.02em' }}>ウチの子</p>

          {/* Name card */}
          <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '18px 24px', marginBottom: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 15, color: '#9ca3af', margin: 0, fontWeight: 500 }}>名前</p>
            <p style={{ fontSize: 36, fontWeight: 800, color: '#111827', margin: 0 }}>{dog.name}</p>
          </div>

          {/* Info 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[
              { icon: '📅', label: '年齢', value: ageLabel },
              { icon: '🐾', label: '性別', value: genderFull },
              { icon: '⚖️', label: '体重', value: `${dog.weight} kg` },
              { icon: '🐕', label: '犬種', value: dog.breed },
            ].map(({ icon, label, value }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: 16, padding: '14px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 5px', fontWeight: 500 }}>{icon} {label}</p>
                <p style={{ fontSize: 17, fontWeight: 600, color: '#1f2937', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Personality card */}
          <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '20px 24px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.05em' }}>✦ 性格タイプ</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#f97316', margin: '0 0 10px', lineHeight: 1.2 }}>{dog.temperamentType}</p>
            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.8, margin: 0 }}>
              {typeDesc.split('\n').join('　')}
            </p>
          </div>
        </div>

        {/* CARD 3: Breed + Difficulty */}
        <div ref={card3Ref} style={{ ...baseCard, backgroundColor: '#F2F2F7', padding: '36px' }}>
          {/* App branding */}
          <p style={{ fontSize: 18, fontWeight: 700, color: '#f97316', margin: '0 0 16px', letterSpacing: '0.02em' }}>ウチの子</p>

          {/* Breed characteristics card */}
          {(breedInfo.purpose || breedInfo.pros) && (
            <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '16px 20px', marginBottom: 10, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>🐶 {dog.breed}の特徴</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {breedInfo.origin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, minWidth: 40, fontWeight: 500 }}>原産国</p>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{breedInfo.origin}</p>
                  </div>
                )}
                {breedInfo.purpose && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, minWidth: 40, fontWeight: 500 }}>目的</p>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{breedInfo.purpose}</p>
                  </div>
                )}
                {breedInfo.pros && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <p style={{ fontSize: 11, color: '#22c55e', margin: 0, minWidth: 40, fontWeight: 600 }}>長所</p>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{breedInfo.pros}</p>
                  </div>
                )}
                {breedInfo.cons && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <p style={{ fontSize: 11, color: '#f87171', margin: 0, minWidth: 40, fontWeight: 600 }}>短所</p>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.5 }}>{breedInfo.cons}</p>
                  </div>
                )}
              </div>
              {breedInfo.chip && (
                <p style={{ fontSize: 11, color: '#6b7280', margin: '10px 0 0', lineHeight: 1.7, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>{breedInfo.chip}</p>
              )}
            </div>
          )}

          {/* Difficulty description card */}
          <div style={{ backgroundColor: 'white', borderRadius: 20, padding: '16px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px', fontWeight: 600, letterSpacing: '0.05em' }}>✦ 詳細説明</p>
            <div>
              {diffParagraphs.slice(0, 3).map((p, i) => (
                <p key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.8, margin: i > 0 ? '8px 0 0' : '0' }}>
                  {p.replace(/\n/g, '')}
                </p>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
