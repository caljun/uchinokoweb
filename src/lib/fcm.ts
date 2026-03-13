'use client'

import { getToken } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { getMessagingInstance } from './firebase'
import { db } from './firebase'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export async function registerPushToken(uid: string): Promise<void> {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (!VAPID_KEY) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const messaging = getMessagingInstance()
    if (!messaging) return

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
    })

    if (token) {
      await updateDoc(doc(db, 'owners', uid), { fcmToken: token })
    }
  } catch {
    // 通知拒否・ブラウザ非対応は無視
  }
}
