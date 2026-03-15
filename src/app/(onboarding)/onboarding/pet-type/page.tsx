'use client'

import { useRouter } from 'next/navigation'

export default function OnboardingPetTypePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-16 pb-10">
      <div className="mb-8">
        <p className="text-xs text-gray-400 mb-1">STEP 2 / 3</p>
        <div className="flex gap-1.5">
          <div className="h-1 flex-1 rounded-full bg-orange-400" />
          <div className="h-1 flex-1 rounded-full bg-orange-400" />
          <div className="h-1 flex-1 rounded-full bg-gray-200" />
        </div>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-1">ウチの子はどっち？</h1>
      <p className="text-sm text-gray-400 mb-12">ペットの種類を選んでください</p>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push('/onboarding/dog')}
          className="w-full py-8 bg-orange-50 border-2 border-orange-200 rounded-2xl flex flex-col items-center gap-3 hover:bg-orange-100 hover:border-orange-400 transition-colors"
        >
          <span className="text-5xl">🐶</span>
          <span className="text-lg font-bold text-gray-800">犬</span>
        </button>

        <button
          onClick={() => router.push('/onboarding/cat')}
          className="w-full py-8 bg-orange-50 border-2 border-orange-200 rounded-2xl flex flex-col items-center gap-3 hover:bg-orange-100 hover:border-orange-400 transition-colors"
        >
          <span className="text-5xl">🐱</span>
          <span className="text-lg font-bold text-gray-800">猫</span>
        </button>
      </div>
    </div>
  )
}
