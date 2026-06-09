import { Sidebar } from '@/components/layout/Sidebar'
import { NowPlayingBar } from '@/components/layout/NowPlayingBar'
import { AudioProvider } from '@/components/providers/AudioProvider'

export default function MainLayout({ children }: { children: React.ReactNode }) {
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
