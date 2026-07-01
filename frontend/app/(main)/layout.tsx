'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { NowPlayingBar } from '@/components/layout/NowPlayingBar'
import { AudioProvider } from '@/components/providers/AudioProvider'
import { useAuthStore } from '@/stores/authStore'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    // if not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  // show nothing while checking auth state
  if (!user) return null

  return (
    <AudioProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-[90px] min-w-0">
          {children}
        </main>
        <NowPlayingBar />
      </div>
    </AudioProvider>
  )
}
