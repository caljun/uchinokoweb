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
  collection, getDocs, query, limit,
  increment, runTransaction,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from '@/lib/firebase'

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
  // ゲーム関連
  totalPoints: number
  weeklyPoints: number
  weeklyPointsWeekStr?: string
  primaryDogName?: string
  friendId?: string
  pendingPoints?: number
}

interface AuthContextType {
  user: User | null
  owner: OwnerProfile | null
  hasDog: boolean | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string, referralCode?: string, referrerDogId?: string) => Promise<void>
  signOut: () => Promise<void>
  reloadOwner: () => Promise<void>
  setHasDog: (v: boolean) => void
  addMissionPoints: (dogId: string, missionId: string, points: number) => Promise<boolean>
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
    totalPoints: (data.totalPoints as number) ?? 0,
    weeklyPoints: (data.weeklyPoints as number) ?? 0,
    weeklyPointsWeekStr: data.weeklyPointsWeekStr as string | undefined,
    primaryDogName: data.primaryDogName as string | undefined,
    friendId: data.friendId as string | undefined,
    pendingPoints: (data.pendingPoints as number) || undefined,
  }
}

// 日本時間（JST = UTC+9）で今日の日付文字列を返す
function getTodayStr(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split('T')[0]
}

// 日本時間で今週の週文字列を返す（月曜始まりISO週番号）
function getCurrentWeekStr(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const d = new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [owner, setOwner] = useState<OwnerProfile | null>(null)
  const [hasDog, setHasDog] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOwner = useCallback(async (uid: string) => {
    const ownerRef = doc(db, 'owners', uid)
    const ownerDoc = await getDoc(ownerRef)
    if (ownerDoc.exists()) {
      const data = ownerDoc.data() as Record<string, unknown>
      if (!data.friendId) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        const friendId = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        await updateDoc(ownerRef, { friendId })
        data.friendId = friendId
      }
      setOwner(parseOwner(uid, data))
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

  const signUp = async (email: string, password: string, displayName: string, referralCode?: string, referrerDogId?: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const friendId = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

    await setDoc(doc(db, 'owners', newUser.uid), {
      email,
      displayName,
      friendId,
      totalPoints: 0,
      weeklyPoints: 0,
      weeklyPointsWeekStr: getCurrentWeekStr(),
      createdAt: serverTimestamp(),
    })

    // referralCodes にエントリを作成（CF が1発で紹介者を取得できるよう）
    await setDoc(doc(db, 'referralCodes', friendId), { ownerUid: newUser.uid })

    // 紹介コードがあれば CF に処理を委譲（失敗してもサインアップは成功させる）
    if (referralCode) {
      try {
        const processReferral = httpsCallable(functions, 'processReferral')
        await processReferral({ referralCode: referralCode.trim().toUpperCase(), dogId: referrerDogId ?? '' })
      } catch {}
    }
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  // ミッション達成 → 犬単位でポイント付与。すでに今日達成済みなら false を返す
  const addMissionPoints = useCallback(async (dogId: string, missionId: string, points: number): Promise<boolean> => {
    if (!user) return false
    const today = getTodayStr()
    const completedRef = doc(db, 'owners', user.uid, 'dogs', dogId, 'completedMissions', `${today}_${missionId}`)
    const dogRef = doc(db, 'owners', user.uid, 'dogs', dogId)
    const currentWeek = getCurrentWeekStr()

    try {
      let awarded = false
      await runTransaction(db, async (tx) => {
        const completedSnap = await tx.get(completedRef)
        if (completedSnap.exists()) return // 今日すでに達成済み

        const dogSnap = await tx.get(dogRef)
        const dogData = dogSnap.data() ?? {}
        const storedWeek = dogData.weeklyPointsWeekStr as string | undefined
        const weeklyReset = storedWeek !== currentWeek

        tx.set(completedRef, { missionId, points, completedAt: serverTimestamp() })
        tx.update(dogRef, {
          ownerId: user.uid, // ランキング用にownerId を常に保持
          totalPoints: increment(points),
          weeklyPoints: weeklyReset ? points : increment(points),
          weeklyPointsWeekStr: currentWeek,
        })
        awarded = true
      })

      return awarded
    } catch {
      return false
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, owner, hasDog, loading, signIn, signUp, signOut, reloadOwner, setHasDog, addMissionPoints }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
