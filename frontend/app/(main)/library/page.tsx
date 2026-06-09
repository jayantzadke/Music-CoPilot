'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/authStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { getImageUrl, formatDuration } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'

export default function LibraryPage() {
  const user = useAuthStore((s) => s.user)
  const { likedSongs, recentlyPlayed } = useLibraryStore()
  const { playSong } = usePlayerStore()

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 px-6 text-center">
        <h2 className="text-2xl font-bold">Your Library</h2>
        <p className="text-muted">sign in to see your liked songs, history and playlists</p>
        <Link
          href="/login"
          className="px-8 py-3 rounded-full bg-white text-black font-bold text-sm hover:bg-gray-100 transition-colors"
        >
          Log in
        </Link>
      </div>
    )
  }

  return (
    <div className="py-6 px-6">
      <h1 className="text-3xl font-bold mb-8">Your Library</h1>

      {/* liked songs */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Liked Songs</h2>
        {likedSongs.length === 0 ? (
          <p className="text-muted text-sm">songs you like will appear here</p>
        ) : (
          <div className="space-y-1">
            {likedSongs.slice(0, 20).map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-surface-hover cursor-pointer transition-colors"
                onClick={() => playSong(song, likedSongs)}
              >
                <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                  <Image src={getImageUrl(song.image, '50x50')} alt={song.name} fill sizes="40px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{song.name}</p>
                  <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
                </div>
                <span className="text-xs text-muted">{formatDuration(song.duration)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* recently played */}
      <section>
        <h2 className="text-xl font-bold mb-4">Recently Played</h2>
        {recentlyPlayed.length === 0 ? (
          <p className="text-muted text-sm">your recently played songs will appear here</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentlyPlayed.slice(0, 10).map((song) => (
              <div
                key={song.id}
                className="group flex flex-col gap-2 p-3 rounded-md bg-surface hover:bg-surface-elevated cursor-pointer transition-colors w-[140px] shrink-0"
                onClick={() => playSong(song, recentlyPlayed)}
              >
                <div className="relative aspect-square w-full rounded overflow-hidden">
                  <Image src={getImageUrl(song.image, '150x150')} alt={song.name} fill sizes="140px" className="object-cover" />
                </div>
                <p className="text-xs text-white truncate font-medium">{song.name}</p>
                <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
