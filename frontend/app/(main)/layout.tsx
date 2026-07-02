'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { NowPlayingBar } from '@/components/layout/NowPlayingBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { AudioProvider } from '@/components/providers/AudioProvider'
import { useAuthStore } from '@/stores/authStore'
import { usePlayerStore } from '@/stores/playerStore'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const currentSong = usePlayerStore((s) => s.currentSong)

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (!user) return null

  // extra bottom padding when player bar is visible on mobile
  const bottomPad = currentSong ? 'pb-[154px] md:pb-[90px]' : 'pb-16 md:pb-0'

  return (
    <AudioProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto min-w-0 ${bottomPad}`}>
          {children}
        </main>
        <NowPlayingBar />
        <MobileNav />
      </div>
    </AudioProvider>
  )
}
