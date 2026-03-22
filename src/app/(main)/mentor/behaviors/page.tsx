'use client'

import Link from 'next/link'
import { BEHAVIORS } from '@/data/behaviors'

export default function BehaviorsPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-800">問題行動ライブラリ</h1>
          <p className="text-sm text-gray-400 mt-0.5">うちの子が今やっていることを選んでください</p>
        </div>

        <div className="px-4 py-4 space-y-3">
          {BEHAVIORS.map((behavior) => (
            <Link
              key={behavior.id}
              href={`/mentor/behaviors/${behavior.id}`}
              className="block bg-white rounded-2xl border border-gray-100 px-4 py-4 hover:border-orange-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">#{behavior.id}</span>
                  <p className="font-bold text-gray-800 mt-0.5">{behavior.title}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">「{behavior.dogVoice.slice(0, 25)}…」</p>
                </div>
                <span className="text-gray-300 text-xl">›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
