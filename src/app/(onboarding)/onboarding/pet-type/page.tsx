'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPetTypePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/onboarding/dog')
  }, [router])

  return null
}
