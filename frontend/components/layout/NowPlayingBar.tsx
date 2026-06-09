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
      <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-[#181818] border-t border-border z-50 px-4 flex items-center gap-4">
        {/* left — song info */}
        <SongInfo />

        {/* center — controls + progress */}
        <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <AudioControls />
          <ProgressBar />
        </div>

        {/* right — volume + extra controls */}
        <div className="flex items-center gap-3 w-[30%] justify-end">
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

      {showQueue && <QueueDrawer />}
    </>
  )
}
