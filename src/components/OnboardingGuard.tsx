'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export function OnboardingGuard() {
  const { user, owner, hasDog, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (hasDog === null) return // 犬の有無をまだ確認中

    if (!owner?.photoUrl) {
      router.replace('/onboarding/profile')
    } else if (hasDog === false) {
      router.replace('/onboarding/pet-type')
    }
  }, [loading, user, owner, hasDog, router])

  return null
}
