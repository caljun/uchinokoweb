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
} from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export interface OwnerProfile {
  uid: string
  email: string
  // 表示名（後方互換のため両方保持）
  displayName?: string
  name?: string
  nameKana?: string
  photoUrl?: string
  latitude?: number
  longitude?: number
  gender?: string
  // 生年月日（後方互換のため両方保持。iOS は birthday, web 旧版は birthDate）
  birthDate?: string
  birthday?: string
  // 住所（旧: address 1フィールド / iOS: 細分化フィールド）
  address?: string
  phone?: string
  postalCode?: string
  prefecture?: string
  city?: string
  street?: string
  building?: string
  // お気に入り（Firestore フィールド名: favorite_store_ids / favorite_product_ids）
  favoriteStoreIds: string[]
  favoriteProductIds: string[]
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
}

const AuthContext = createContext<AuthContextType | null>(null)

// FirestoreのTimestamp・Date・文字列を "YYYY-MM-DD" 文字列に変換
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
  }
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
    // 犬が1頭でも登録されているか確認
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

  return (
    <AuthContext.Provider value={{ user, owner, hasDog, loading, signIn, signUp, signOut, reloadOwner, setHasDog, toggleFavoriteStore }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
