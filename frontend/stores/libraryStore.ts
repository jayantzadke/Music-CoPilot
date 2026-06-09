'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song, Artist } from '@/types'

const MAX_RECENT = 50

interface LibraryStore {
  likedSongs: Song[]
  recentlyPlayed: Song[]
  followedArtists: Artist[]

  isLiked: (songId: string) => boolean
  isFollowing: (artistId: string) => boolean
  toggleLike: (song: Song) => void
  addToRecent: (song: Song) => void
  toggleFollow: (artist: Artist) => void
  clearRecent: () => void
}

export const useLibraryStore = create<LibraryStore>()(
  persist(
    (set, get) => ({
      likedSongs: [],
      recentlyPlayed: [],
      followedArtists: [],

      isLiked: (songId) => get().likedSongs.some((s) => s.id === songId),
      isFollowing: (artistId) => get().followedArtists.some((a) => a.id === artistId),

      toggleLike: (song) => {
        const { likedSongs, isLiked } = get()
        if (isLiked(song.id)) {
          set({ likedSongs: likedSongs.filter((s) => s.id !== song.id) })
        } else {
          set({ likedSongs: [song, ...likedSongs] })
        }
      },

      addToRecent: (song) => {
        const { recentlyPlayed } = get()
        // remove if already in list, then add to front
        const filtered = recentlyPlayed.filter((s) => s.id !== song.id)
        set({ recentlyPlayed: [song, ...filtered].slice(0, MAX_RECENT) })
      },

      toggleFollow: (artist) => {
        const { followedArtists, isFollowing } = get()
        if (isFollowing(artist.id)) {
          set({ followedArtists: followedArtists.filter((a) => a.id !== artist.id) })
        } else {
          set({ followedArtists: [artist, ...followedArtists] })
        }
      },

      clearRecent: () => set({ recentlyPlayed: [] }),
    }),
    {
      name: 'library',
    },
  ),
)
