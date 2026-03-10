'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  arrayUnion, arrayRemove,
  collection, getDocs, query, limit,
  increment, runTransaction,
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export interface OwnerProfile {
  uid: string
  email: string
  displayName?: string
  name?: string
  nameKana?: string
  photoUrl?: string
  latitude?: number
  longitude?: number
  gender?: string
  birthDate?: string
  birthday?: string
  address?: string
  phone?: string
  postalCode?: string
  prefecture?: string
  city?: string
  street?: string
  building?: string
  favoriteStoreIds: string[]
  favoriteProductIds: string[]
  // ゲーム関連
  totalPoints: number
  weeklyPoints: number
  weeklyPointsWeekStr?: string
  primaryDogName?: string
}

interface AuthContextType {
  user: User | null
  owner: OwnerProfile | null
  hasDog: boolean | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  reloadOwner: () => Promise<void>
  setHasDog: (v: boolean) => void
  toggleFavoriteStore: (storeId: string) => Promise<void>
  addMissionPoints: (missionId: string, points: number) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

function toDateString(val: unknown): string | undefined {
  if (!val) return undefined
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    if ('toDate' in (val as object)) {
      return (val as { toDate: () => Date }).toDate().toISOString().split('T')[0]
    }
    if (val instanceof Date) {
      return val.toISOString().split('T')[0]
    }
  }
  return undefined
}

function parseOwner(uid: string, data: Record<string, unknown>): OwnerProfile {
  return {
    uid,
    email: (data.email as string) ?? '',
    displayName: data.displayName as string | undefined,
    name: data.name as string | undefined,
    nameKana: data.nameKana as string | undefined,
    photoUrl: data.photoUrl as string | undefined,
    latitude: data.latitude as number | undefined,
    longitude: data.longitude as number | undefined,
    gender: data.gender as string | undefined,
    birthDate: toDateString(data.birthDate),
    birthday: toDateString(data.birthday),
    address: data.address as string | undefined,
    phone: data.phone as string | undefined,
    postalCode: data.postalCode as string | undefined,
    prefecture: data.prefecture as string | undefined,
    city: data.city as string | undefined,
    street: data.street as string | undefined,
    building: data.building as string | undefined,
    favoriteStoreIds: (data.favorite_store_ids as string[]) ?? [],
    favoriteProductIds: (data.favorite_product_ids as string[]) ?? [],
    totalPoints: (data.totalPoints as number) ?? 0,
    weeklyPoints: (data.weeklyPoints as number) ?? 0,
    weeklyPointsWeekStr: data.weeklyPointsWeekStr as string | undefined,
    primaryDogName: data.primaryDogName as string | undefined,
  }
}

function getCurrentWeekStr(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [owner, setOwner] = useState<OwnerProfile | null>(null)
  const [hasDog, setHasDog] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOwner = useCallback(async (uid: string) => {
    const ownerDoc = await getDoc(doc(db, 'owners', uid))
    if (ownerDoc.exists()) {
      setOwner(parseOwner(uid, ownerDoc.data() as Record<string, unknown>))
    } else {
      setOwner(null)
    }
    const dogsSnap = await getDocs(query(collection(db, 'owners', uid, 'dogs'), limit(1)))
    setHasDog(!dogsSnap.empty)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await fetchOwner(firebaseUser.uid)
      } else {
        setOwner(null)
        setHasDog(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [fetchOwner])

  const reloadOwner = useCallback(async () => {
    if (!user) return
    await fetchOwner(user.uid)
  }, [user, fetchOwner])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'owners', newUser.uid), {
      email,
      displayName,
      totalPoints: 0,
      weeklyPoints: 0,
      weeklyPointsWeekStr: getCurrentWeekStr(),
      createdAt: serverTimestamp(),
    })
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const toggleFavoriteStore = useCallback(async (storeId: string) => {
    if (!user) return
    const isFav = owner?.favoriteStoreIds?.includes(storeId) ?? false
    await updateDoc(doc(db, 'owners', user.uid), {
      favorite_store_ids: isFav ? arrayRemove(storeId) : arrayUnion(storeId),
    })
    await fetchOwner(user.uid)
  }, [user, owner, fetchOwner])

  // ミッション達成 → ポイント付与。すでに今日達成済みなら false を返す
  const addMissionPoints = useCallback(async (missionId: string, points: number): Promise<boolean> => {
    if (!user) return false
    const today = getTodayStr()
    const completedRef = doc(db, 'owners', user.uid, 'completedMissions', `${today}_${missionId}`)
    const ownerRef = doc(db, 'owners', user.uid)
    const currentWeek = getCurrentWeekStr()

    try {
      let awarded = false
      await runTransaction(db, async (tx) => {
        const completedSnap = await tx.get(completedRef)
        if (completedSnap.exists()) return // 今日すでに達成済み

        const ownerSnap = await tx.get(ownerRef)
        const ownerData = ownerSnap.data() ?? {}
        const storedWeek = ownerData.weeklyPointsWeekStr as string | undefined

        const weeklyReset = storedWeek !== currentWeek

        tx.set(completedRef, { missionId, points, completedAt: serverTimestamp() })
        tx.update(ownerRef, {
          totalPoints: increment(points),
          weeklyPoints: weeklyReset ? points : increment(points),
          weeklyPointsWeekStr: currentWeek,
        })
        awarded = true
      })

      if (awarded) await fetchOwner(user.uid)
      return awarded
    } catch {
      return false
    }
  }, [user, fetchOwner])

  return (
    <AuthContext.Provider value={{ user, owner, hasDog, loading, signIn, signUp, signOut, reloadOwner, setHasDog, toggleFavoriteStore, addMissionPoints }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
