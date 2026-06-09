'use client'

import Image from 'next/image'
import { X, GripVertical } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'

export function QueueDrawer() {
  const { queue, queueIndex, currentSong, setShowQueue, removeFromQueue, playSong } = usePlayerStore()

  return (
    <div className="fixed right-0 top-0 bottom-[90px] w-80 bg-[#121212] border-l border-border z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <h3 className="font-semibold text-sm">Queue</h3>
        <button
          onClick={() => setShowQueue(false)}
          className="text-muted hover:text-white transition-colors"
          aria-label="Close queue"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* now playing */}
        {currentSong && (
          <div className="px-4 py-2">
            <p className="text-xs text-muted uppercase font-semibold mb-2">Now playing</p>
            <QueueItem
              song={currentSong}
              isActive
              onPlay={() => null}
              onRemove={() => null}
              showRemove={false}
            />
          </div>
        )}

        {/* up next */}
        <div className="px-4 py-2">
          <p className="text-xs text-muted uppercase font-semibold mb-2">Next up</p>
          {queue.slice(queueIndex + 1).map((song, i) => (
            <QueueItem
              key={`${song.id}-${i}`}
              song={song}
              isActive={false}
              onPlay={() => playSong(song, queue)}
              onRemove={() => removeFromQueue(queueIndex + 1 + i)}
              showRemove
            />
          ))}
          {queue.slice(queueIndex + 1).length === 0 && (
            <p className="text-sm text-muted py-4 text-center">nothing queued up</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface QueueItemProps {
  song: import('@/types').Song
  isActive: boolean
  onPlay: () => void
  onRemove: () => void
  showRemove: boolean
}

function QueueItem({ song, isActive, onPlay, onRemove, showRemove }: QueueItemProps) {
  const imgUrl = getImageUrl(song.image, '50x50')

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer',
        isActive ? 'bg-surface-hover' : 'hover:bg-surface-hover',
      )}
      onClick={onPlay}
    >
      <GripVertical size={16} className="text-muted shrink-0" />
      <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
        <Image src={imgUrl} alt={song.name} fill sizes="40px" className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', isActive ? 'text-accent' : 'text-white')}>{song.name}</p>
        <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
      </div>
      {showRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-white transition-all"
          aria-label="Remove from queue"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
