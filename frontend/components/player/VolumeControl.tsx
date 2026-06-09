'use client'

import { Volume2, VolumeX, Volume1 } from 'lucide-react'
import { usePlayerStore } from '@/stores/playerStore'

export function VolumeControl() {
  const { volume, isMuted, setVolume, toggleMute } = usePlayerStore()
  const displayVolume = isMuted ? 0 : volume

  const VolumeIcon = displayVolume === 0 ? VolumeX : displayVolume < 0.5 ? Volume1 : Volume2

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        className="text-muted hover:text-white transition-colors"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <VolumeIcon size={18} />
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={displayVolume}
        onChange={(e) => setVolume(Number(e.target.value))}
        className="w-24 h-1 cursor-pointer appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, #fff ${displayVolume * 100}%, #404040 ${displayVolume * 100}%)`,
        }}
        aria-label="Volume"
      />
    </div>
  )
}
