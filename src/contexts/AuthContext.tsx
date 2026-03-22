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
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { registerPushToken } from '@/lib/fcm'

export interface OwnerProfile {
  uid: string
  email: string
  displayName?: string
  name?: string
  nameKana?: string
  photoUrl?: string
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
  }
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
        registerPushToken(firebaseUser.uid)
        updateDoc(doc(db, 'owners', firebaseUser.uid), { lastOpenedAt: serverTimestamp() }).catch(() => {})
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const signUp = async (email: string, password: string, displayName: string, _referralCode?: string, _referrerDogId?: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'owners', newUser.uid), {
      email,
      displayName,
      name: displayName,
      createdAt: serverTimestamp(),
    })
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, owner, hasDog, loading, signIn, signUp, signOut, reloadOwner, setHasDog }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
