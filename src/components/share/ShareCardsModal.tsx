'use client'

import { useRef, useState, useEffect } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import { Dog } from '@/types/dog'
import { getBreedDescription } from '@/lib/diagnosis'

const AGE_LABELS = ['パピー期', '成犬期', 'シニア期']
const SIZE_LABELS = ['小型犬', '中型犬', '大型犬']

const TEMPERAMENT_DESCRIPTIONS: Record<string, string> = {
  リーダータイプ:
    '知恵があり勇敢なまとめ役タイプです。\n犬社会と人間社会での自分の役割を理解しており、人の役に立ちたいと思っています。\n仕事を与えて達成感を味わわせてあげましょう。',
  右腕タイプ:
    '活発で楽観的、好奇心旺盛なタイプです。\n目立つ失敗をすることもありますが、リーダータイプの犬や人のもとで能力が向上します。\n運動と刺激をしっかり与えてあげましょう。',
  市民タイプ:
    '遊びを通して序列確認をし合って過ごすタイプです。\n遊びがヒートアップしてケンカになりやすいですが、社交性があり比較的飼いやすいです。\n適度な遊び相手を見つけてあげましょう。',
  守られタイプ:
    '特定の人になつきやすく、その他の人には人見知りをするタイプです。\nいつも抱っこされていたいと思っています。\n環境の変化は苦手なので、社会化を意識して取り組みましょう。',
}

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
  const [generating, setGenerating] = useState(false)
  const [photoSrc, setPhotoSrc] = useState<string>('')

  const ageLabel = AGE_LABELS[dog.ageGroup] ?? '成犬期'
  const sizeLabel = SIZE_LABELS[dog.breedSize] ?? '小型犬'
  const genderLabel = dog.gender === 'male' ? 'オス' : 'メス'
  const genderFull = dog.neutered ? `${genderLabel}（去勢済み）` : genderLabel
  const typeDesc = TEMPERAMENT_DESCRIPTIONS[dog.temperamentType] ?? ''
  const breedInfo = getBreedDescription(dog.breed)
  const diffParagraphs = (dog.difficultyDescription ?? '').split('\n\n').filter(Boolean)

  // 犬の写真を base64 data URL に変換（html2canvas が blob: URL を読めないため）
  useEffect(() => {
    if (!dog.photoUrl) return
    fetch(dog.photoUrl)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
      )
      .then((dataUrl) => setPhotoSrc(dataUrl))
      .catch(() => setPhotoSrc(''))
  }, [dog.photoUrl])

  const handleDownload = async () => {
    setGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const refs = [card1Ref, card2Ref, card3Ref]
      for (let i = 0; i < refs.length; i++) {
        const el = refs[i].current
        if (!el) continue
        // img が全部ロードされるまで待つ
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
        const link = document.createElement('a')
        link.download = `${dog.name}_card${i + 1}.png`
        link.href = canvas.toDataURL('image/png', 0.95)
        link.click()
        await new Promise((r) => setTimeout(r, 400))
      }
    } finally {
      setGenerating(false)
    }
  }

  // ─── カードスタイル基底 ───
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
            <p className="text-xs text-gray-400 mt-0.5">3枚の画像をSNSでシェアしよう</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* プレビュー（3枚） */}
        <div className="px-5 pb-4 flex gap-3 overflow-x-auto">
          {/* Card 1 preview */}
          <div className="shrink-0 w-24 h-32 rounded-xl overflow-hidden relative bg-orange-50 border border-gray-100">
            {(photoSrc || dog.photoUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoSrc || dog.photoUrl}
                alt={dog.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '16px 6px 6px' }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 10, textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{dog.name}</p>
            </div>
          </div>

          {/* Card 2 preview */}
          <div className="shrink-0 w-24 h-32 rounded-xl bg-white border border-gray-100 p-2 flex flex-col">
            <p className="text-xs font-bold text-gray-900 truncate mb-1.5">{dog.name}</p>
            <div className="grid grid-cols-2 gap-1 flex-1">
              {[['年齢', ageLabel], ['性別', genderLabel], ['体重', `${dog.weight}kg`], ['犬種', dog.breed]].map(([l, v]) => (
                <div key={l} className="bg-orange-50 rounded-md p-1">
                  <p className="text-gray-400" style={{ fontSize: 7 }}>{l}</p>
                  <p className="font-semibold text-gray-800 truncate" style={{ fontSize: 8 }}>{v}</p>
                </div>
              ))}
            </div>
            <p className="text-orange-500 font-bold mt-1.5 truncate" style={{ fontSize: 9 }}>{dog.temperamentType}</p>
          </div>

          {/* Card 3 preview */}
          <div className="shrink-0 w-24 h-32 rounded-xl bg-white border border-gray-100 p-2">
            <p className="font-bold text-gray-900 mb-1" style={{ fontSize: 8 }}>詳細説明</p>
            <p className="text-gray-500 leading-relaxed" style={{ fontSize: 7 }}>
              {diffParagraphs[0]?.slice(0, 120) ?? ''}
            </p>
          </div>
        </div>

        {/* ダウンロードボタン */}
        <div className="px-5 pb-8">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Download size={16} />
                3枚まとめてダウンロード
              </>
            )}
          </button>
        </div>
      </div>

      {/* ───── オフスクリーンカード（html2canvas 用） ───── */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', pointerEvents: 'none' }}>

        {/* ===== CARD 1: Photo ===== */}
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
          {/* グラデーションオーバーレイ */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', padding: '100px 36px 44px' }}>
            <p style={{ color: 'white', fontSize: 46, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{dog.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 22, margin: '8px 0 0', fontWeight: 500 }}>
              {ageLabel} ・ {genderLabel} ・ {dog.breed}
            </p>
          </div>
          {/* ブランド */}
          <div style={{ position: 'absolute', top: 28, right: 32 }}>
            <p style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.5)', letterSpacing: '0.02em' }}>ウチの子</p>
          </div>
        </div>

        {/* ===== CARD 2: Info ===== */}
        <div ref={card2Ref} style={{ ...baseCard, backgroundColor: 'white', padding: 44 }}>
          {/* 名前 */}
          <p style={{ fontSize: 42, fontWeight: 700, color: '#111827', margin: '0 0 4px', lineHeight: 1.2 }}>{dog.name}</p>
          <p style={{ fontSize: 20, color: '#9ca3af', margin: '0 0 28px', fontWeight: 500 }}>{sizeLabel} ・ {dog.breed}</p>

          {/* 基本情報グリッド */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
            {[
              { label: '年齢', value: ageLabel },
              { label: '性別', value: genderFull },
              { label: '体重', value: `${dog.weight} kg` },
              { label: '犬種', value: dog.breed },
            ].map(({ label, value }) => (
              <div key={label} style={{ backgroundColor: '#FFF7ED', borderRadius: 16, padding: '16px 20px' }}>
                <p style={{ fontSize: 16, color: '#9ca3af', margin: '0 0 5px', fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 600, color: '#1f2937', margin: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* 区切り線 */}
          <div style={{ height: 1, backgroundColor: '#f3f4f6', margin: '0 0 28px' }} />

          {/* 性格タイプ */}
          <p style={{ fontSize: 17, color: '#9ca3af', margin: '0 0 8px', fontWeight: 500 }}>性格タイプ</p>
          <p style={{ fontSize: 34, fontWeight: 700, color: '#f97316', margin: '0 0 14px', lineHeight: 1.3 }}>{dog.temperamentType}</p>
          <p style={{ fontSize: 18, color: '#6b7280', lineHeight: 1.75, margin: 0 }}>
            {typeDesc.split('\n').slice(0, 2).join(' ')}
          </p>

          {/* ブランド */}
          <p style={{ position: 'absolute', bottom: 36, right: 40, fontSize: 20, fontWeight: 700, color: '#f97316', margin: 0, letterSpacing: '0.02em' }}>ウチの子</p>
        </div>

        {/* ===== CARD 3: Breed + Difficulty ===== */}
        <div ref={card3Ref} style={{ ...baseCard, backgroundColor: 'white', padding: 44 }}>
          {/* 犬種の特徴 */}
          {(breedInfo.purpose || breedInfo.pros) && (
            <>
              <p style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>【{dog.breed}の特徴】</p>
              <div style={{ marginBottom: 24 }}>
                {breedInfo.origin && <p style={{ fontSize: 17, color: '#6b7280', margin: '0 0 6px' }}>原産国: {breedInfo.origin}</p>}
                {breedInfo.purpose && <p style={{ fontSize: 17, color: '#6b7280', margin: '0 0 6px' }}>目的: {breedInfo.purpose}</p>}
                {breedInfo.pros && <p style={{ fontSize: 17, color: '#6b7280', margin: '0 0 6px' }}>長所: {breedInfo.pros}</p>}
                {breedInfo.cons && <p style={{ fontSize: 17, color: '#6b7280', margin: '0 0 6px' }}>短所: {breedInfo.cons}</p>}
              </div>
              <div style={{ height: 1, backgroundColor: '#f3f4f6', margin: '0 0 24px' }} />
            </>
          )}

          {/* 詳細説明 */}
          <p style={{ fontSize: 20, color: '#9ca3af', margin: '0 0 14px', fontWeight: 500 }}>詳細説明</p>
          <div>
            {diffParagraphs.slice(0, 3).map((p, i) => (
              <p key={i} style={{ fontSize: 17, color: '#374151', lineHeight: 1.75, margin: i > 0 ? '14px 0 0' : '0' }}>
                {p.replace(/\n/g, '')}
              </p>
            ))}
          </div>

          {/* ブランド */}
          <p style={{ position: 'absolute', bottom: 36, right: 40, fontSize: 20, fontWeight: 700, color: '#f97316', margin: 0, letterSpacing: '0.02em' }}>ウチの子</p>
        </div>

      </div>
    </div>
  )
}
