'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { BEHAVIORS } from '@/data/behaviors'

export default function BehaviorDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  const behavior = BEHAVIORS.find((b) => b.id === Number(id))
  if (!behavior) return <div className="p-8 text-center text-gray-400">見つかりませんでした</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
          <button onClick={() => router.back()} className="text-gray-400 text-sm mb-2">← 戻る</button>
          <p className="text-xs text-gray-400">問題行動 #{behavior.id}</p>
          <h1 className="text-xl font-bold text-gray-800 mt-0.5">{behavior.title}</h1>
        </div>

        <div className="px-4 py-6 space-y-4">
          {/* 犬の言い分（メイン表示） */}
          <div className="bg-orange-50 rounded-2xl border border-orange-100 px-5 py-5">
            <p className="text-xs font-bold text-orange-500 mb-2 tracking-wider">犬の言い分</p>
            <p className="text-xl font-bold text-gray-800 leading-relaxed">
              「{behavior.dogVoice}」
            </p>
          </div>

          {/* 脳で起きていること（折りたたみ） */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-bold text-gray-700">🧠 脳で起きていること</span>
              <span className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {expanded && (
              <div className="px-5 pb-5">
                <p className="text-sm text-gray-600 leading-relaxed">{behavior.brainExplanation}</p>
              </div>
            )}
          </div>

          {/* ミッションへの誘導 */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 px-4 py-4">
            <p className="text-sm font-bold text-blue-700 mb-1">改善のヒント</p>
            <p className="text-xs text-gray-500">
              ミッションページから、この問題行動に対応するアプローチを実践しましょう。
            </p>
            <a href="/mentor/missions" className="inline-block mt-2 text-xs text-blue-500 font-medium">
              ミッションを見る →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
