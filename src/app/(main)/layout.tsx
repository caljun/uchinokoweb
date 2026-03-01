'use client'

import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import Footer from '@/components/layout/Footer'
import AuthModal from '@/components/AuthModal'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import { OnboardingGuard } from '@/components/OnboardingGuard'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthModalProvider>
      <OnboardingGuard />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-1 pb-28 lg:pb-0">{children}</main>
        <BottomNav />
        <Footer />
      </div>
      <AuthModal />
    </AuthModalProvider>
  )
}
