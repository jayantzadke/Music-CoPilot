'use client'

import { ListMusic } from 'lucide-react'
import { SongInfo } from '@/components/player/SongInfo'
import { AudioControls } from '@/components/player/AudioControls'
import { ProgressBar } from '@/components/player/ProgressBar'
import { VolumeControl } from '@/components/player/VolumeControl'
import { QueueDrawer } from './QueueDrawer'
import { cn } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'

export function NowPlayingBar() {
  const { currentSong, showQueue, setShowQueue } = usePlayerStore()

  if (!currentSong) return null

  return (
    <>
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-[#181818] border-t border-border z-50">
        {/* progress bar — full width on top for mobile */}
        <div className="px-4 pt-2 md:hidden">
          <ProgressBar />
        </div>

        <div className="px-4 py-2 md:py-0 md:h-[90px] flex items-center gap-2 md:gap-4">
          {/* song info */}
          <SongInfo />

          {/* center — desktop only full controls, mobile just play/pause/next */}
          <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <AudioControls />
            {/* progress bar hidden on mobile (shown above) */}
            <div className="hidden md:block w-full max-w-[600px]">
              <ProgressBar />
            </div>
          </div>

          {/* right — volume (desktop only) + queue */}
          <div className="hidden md:flex items-center gap-3 w-[30%] justify-end">
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={cn('text-muted hover:text-white transition-colors', showQueue && 'text-accent')}
              aria-label="Queue"
            >
              <ListMusic size={18} />
            </button>
            <VolumeControl />
          </div>
        </div>
      </div>

      {showQueue && <QueueDrawer />}
    </>
  )
}
