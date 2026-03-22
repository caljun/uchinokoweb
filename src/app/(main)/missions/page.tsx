'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function MissionsOldPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/mentor/missions') }, [router])
  return null
}
