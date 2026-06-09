'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { SongRow } from './SongRow'
import type { Song } from '@/types'

interface TrackListProps {
  songs: Song[]
  showAlbum?: boolean
}

const ROW_HEIGHT = 56
const VIRTUALISE_THRESHOLD = 30

export function TrackList({ songs, showAlbum = false }: TrackListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: songs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    enabled: songs.length > VIRTUALISE_THRESHOLD,
  })

  if (songs.length <= VIRTUALISE_THRESHOLD) {
    return (
      <div role="table" aria-label="Track list">
        {songs.map((song, i) => (
          <SongRow key={song.id} song={song} index={i} queue={songs} showAlbum={showAlbum} />
        ))}
      </div>
    )
  }

  return (
    <div ref={parentRef} className="overflow-auto" style={{ height: Math.min(songs.length * ROW_HEIGHT, 600) }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }} role="table">
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const song = songs[virtualRow.index]
          if (!song) return null
          return (
            <div
              key={virtualRow.key}
              style={{ position: 'absolute', top: 0, transform: `translateY(${virtualRow.start}px)`, width: '100%' }}
            >
              <SongRow song={song} index={virtualRow.index} queue={songs} showAlbum={showAlbum} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
