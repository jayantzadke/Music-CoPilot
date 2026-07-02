'use client'

import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'

export function AudioControls() {
  const {
    isPlaying, isLoading, shuffle, repeat,
    togglePlay, next, previous, toggleShuffle, cycleRepeat,
  } = usePlayerStore()

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="flex items-center gap-3 md:gap-4">
        {/* shuffle — hidden on mobile */}
        <button
          onClick={toggleShuffle}
          className={cn('hidden md:block transition-colors', shuffle ? 'text-accent' : 'text-muted hover:text-white')}
          aria-label="Shuffle"
        >
          <Shuffle size={18} />
        </button>

        {/* prev */}
        <button
          onClick={previous}
          className="text-muted hover:text-white transition-colors"
          aria-label="Previous"
        >
          <SkipBack size={20} fill="currentColor" />
        </button>

        {/* play/pause */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform text-black"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        {/* next */}
        <button
          onClick={next}
          className="text-muted hover:text-white transition-colors"
          aria-label="Next"
        >
          <SkipForward size={20} fill="currentColor" />
        </button>

        {/* repeat — hidden on mobile */}
        <button
          onClick={cycleRepeat}
          className={cn('hidden md:block transition-colors relative', repeat !== 'none' ? 'text-accent' : 'text-muted hover:text-white')}
          aria-label="Repeat"
        >
          {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
          {repeat !== 'none' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
          )}
        </button>
      </div>
    </div>
  )
}
