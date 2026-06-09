'use client'

import { useState } from 'react'
import { formatDuration } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'

export function ProgressBar() {
  const { currentTime, duration, seek } = usePlayerStore()
  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState(0)

  const progress = duration > 0 ? currentTime / duration : 0
  const displayProgress = isDragging ? dragValue : progress

  return (
    <div className="flex items-center gap-2 w-full max-w-[600px]">
      <span className="text-xs text-muted tabular-nums w-10 text-right">
        {formatDuration(currentTime)}
      </span>

      <div className="flex-1 group relative">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={displayProgress}
          onMouseDown={() => setIsDragging(true)}
          onChange={(e) => setDragValue(Number(e.target.value))}
          onMouseUp={(e) => {
            seek(Number((e.target as HTMLInputElement).value))
            setIsDragging(false)
          }}
          className="w-full h-1 accent-white cursor-pointer appearance-none rounded-full bg-border
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:opacity-0
            group-hover:[&::-webkit-slider-thumb]:opacity-100"
          style={{
            background: `linear-gradient(to right, #fff ${displayProgress * 100}%, #404040 ${displayProgress * 100}%)`,
          }}
          aria-label="Seek"
        />
      </div>

      <span className="text-xs text-muted tabular-nums w-10">
        {formatDuration(duration)}
      </span>
    </div>
  )
}
