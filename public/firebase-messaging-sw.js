importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyD1yrrk-hVydWhF9zq4mbBsLX6vcu_EFP0',
  authDomain: 'uchinoko-53c2f.firebaseapp.com',
  projectId: 'uchinoko-53c2f',
  storageBucket: 'uchinoko-53c2f.firebasestorage.app',
  messagingSenderId: '842238787202',
  appId: '1:842238787202:web:6e604fe37d3d17d7a9fe9b',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'ウチの子'
  const body = payload.notification?.body ?? ''
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  })
})
