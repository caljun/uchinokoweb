'use client'

import { useRouter } from 'next/navigation'

const FEATURES = [
  {
    icon: '📸',
    title: 'ミッション',
    desc: '毎日の写真でポイントを貯めよう。正面向き、お散歩中など、ミッションをこなすほど上位を狙える。',
  },
  {
    icon: '🏆',
    title: 'ランキング',
    desc: '毎週リセット。飼い主の努力が順位に直結する。かわいさじゃなく、あなたの頑張りで1位になれる。',
  },
  {
    icon: '🛍️',
    title: 'おすすめ',
    desc: 'うちの子の犬種・年齢・サイズをもとにぴったりのグッズやごはんをピックアップ。',
  },
]

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-16 pb-10">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">登録完了！</h1>
        <p className="text-sm text-gray-400 mt-2">ウチの子へようこそ</p>
      </div>

      <div className="space-y-4 mb-10">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-4 bg-orange-50 rounded-2xl p-4">
            <div className="text-3xl pt-0.5">{f.icon}</div>
            <div>
              <p className="font-bold text-gray-900 text-base">{f.title}</p>
              <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <button
          onClick={() => router.replace('/uchinoko')}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-base hover:bg-orange-600 transition-colors"
        >
          さあはじめよう →
        </button>
      </div>
    </div>
  )
}
