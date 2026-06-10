'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { getImageUrl, formatDuration } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'
import { apiClient } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import type { Song } from '@/types'

interface LikedSongRow {
  id: string
  songId: string
  songName: string
  songImage: string | null
  songArtists: string
  songDuration: number
  albumId: string | null
  likedAt: string
}

function rowToSong(row: LikedSongRow): Song {
  return {
    id: row.songId,
    name: row.songName,
    primaryArtists: row.songArtists,
    duration: row.songDuration,
    image: row.songImage ? [{ quality: '150x150', url: row.songImage }] : [],
    album: { id: row.albumId ?? '', name: '', url: '' },
    downloadUrl: [],
  } as unknown as Song
}

export default function LibraryPage() {
  const user = useAuthStore((s) => s.user)
  const { likedSongs: localLiked, recentlyPlayed } = useLibraryStore()
  const { playSong } = usePlayerStore()
  const [dbLiked, setDbLiked] = useState<LikedSongRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    apiClient.library.liked()
      .then((res: unknown) => {
        const data = (res as { data: LikedSongRow[] }).data ?? []
        setDbLiked(data)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 px-6 text-center">
        <Heart size={48} className="text-muted" />
        <h2 className="text-2xl font-bold">Your Library</h2>
        <p className="text-muted">sign in to see your liked songs and history</p>
        <Link
          href="/login"
          className="px-8 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-100 transition-colors"
        >
          Log in
        </Link>
      </div>
    )
  }

  const displaySongs = dbLiked.length > 0
    ? dbLiked.map(rowToSong)
    : localLiked

  const playableSongs = displaySongs

  return (
    <div className="py-6 px-6">
      <h1 className="text-3xl font-bold mb-2">Your Library</h1>
      <p className="text-muted text-sm mb-8">everything you&apos;ve saved in one place</p>

      {/* liked songs */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Heart size={20} className="text-accent" />
          Liked Songs
          {displaySongs.length > 0 && (
            <span className="text-sm text-muted font-normal ml-1">{displaySongs.length}</span>
          )}
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2">
                <Skeleton className="w-10 h-10 rounded bg-elevated" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-48 bg-elevated" />
                  <Skeleton className="h-3 w-32 bg-elevated" />
                </div>
              </div>
            ))}
          </div>
        ) : displaySongs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted text-sm">songs you like will appear here</p>
            <p className="text-xs text-subtle mt-1">tap the heart on any song to save it</p>
          </div>
        ) : (
          <div className="space-y-1">
            {displaySongs.map((song, i) => (
              <div
                key={song.id}
                className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-elevated cursor-pointer transition-colors"
                onClick={() => playSong(song, playableSongs)}
              >
                <span className="text-xs text-muted w-4 text-right shrink-0">{i + 1}</span>
                <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                  <Image
                    src={getImageUrl(song.image, '50x50') || '/placeholder-music.png'}
                    alt={song.name}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{song.name}</p>
                  <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
                </div>
                <span className="text-xs text-muted shrink-0">{formatDuration(song.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* recently played */}
      {recentlyPlayed.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Recently Played</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentlyPlayed.slice(0, 10).map((song) => (
              <div
                key={song.id}
                className="group flex flex-col gap-2 p-3 rounded-md bg-surface hover:bg-elevated cursor-pointer transition-colors w-[140px] shrink-0"
                onClick={() => playSong(song, recentlyPlayed)}
              >
                <div className="relative aspect-square w-full rounded overflow-hidden">
                  <Image
                    src={getImageUrl(song.image, '150x150') || '/placeholder-music.png'}
                    alt={song.name}
                    fill
                    sizes="140px"
                    className="object-cover"
                  />
                </div>
                <p className="text-xs text-white truncate font-medium">{song.name}</p>
                <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
