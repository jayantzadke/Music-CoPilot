'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song, AudioQuality, RepeatMode } from '@/types'

interface PlayerStore {
  currentSong: Song | null
  queue: Song[]
  originalQueue: Song[]
  queueIndex: number
  isPlaying: boolean
  isLoading: boolean
  progress: number
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  quality: AudioQuality
  shuffle: boolean
  repeat: RepeatMode
  showQueue: boolean
  showLyrics: boolean

  playSong: (song: Song, queue?: Song[]) => void
  playQueue: (songs: Song[], startIndex?: number) => void
  togglePlay: () => void
  next: () => void
  previous: () => void
  seek: (pct: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsLoading: (loading: boolean) => void
  setVolume: (v: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  addToQueue: (song: Song) => void
  removeFromQueue: (index: number) => void
  reorderQueue: (from: number, to: number) => void
  setQuality: (q: AudioQuality) => void
  setShowQueue: (show: boolean) => void
  setShowLyrics: (show: boolean) => void
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      queue: [],
      originalQueue: [],
      queueIndex: 0,
      isPlaying: false,
      isLoading: false,
      progress: 0,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      quality: '320kbps',
      shuffle: false,
      repeat: 'none',
      showQueue: false,
      showLyrics: false,

      playSong: (song, queue) => {
        const q = queue ?? [song]
        const idx = q.findIndex((s) => s.id === song.id)
        set({
          currentSong: song,
          queue: q,
          originalQueue: q,
          queueIndex: idx >= 0 ? idx : 0,
          isPlaying: true,
          progress: 0,
          currentTime: 0,
        })
      },

      playQueue: (songs, startIndex = 0) => {
        if (!songs.length) return
        set({
          currentSong: songs[startIndex] ?? null,
          queue: songs,
          originalQueue: songs,
          queueIndex: startIndex,
          isPlaying: true,
          progress: 0,
          currentTime: 0,
        })
      },

      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

      next: () => {
        const { queue, queueIndex, repeat } = get()
        if (!queue.length) return

        if (repeat === 'one') {
          set({ progress: 0, currentTime: 0, isPlaying: true })
          return
        }

        const nextIdx = queueIndex + 1
        if (nextIdx >= queue.length) {
          if (repeat === 'all') {
            set({ queueIndex: 0, currentSong: queue[0] ?? null, progress: 0, currentTime: 0 })
          } else {
            set({ isPlaying: false })
          }
          return
        }

        set({ queueIndex: nextIdx, currentSong: queue[nextIdx] ?? null, progress: 0, currentTime: 0 })
      },

      previous: () => {
        const { queue, queueIndex, currentTime } = get()
        // if we're more than 3 seconds in, restart the current song
        if (currentTime > 3) {
          set({ progress: 0, currentTime: 0 })
          return
        }

        const prevIdx = Math.max(0, queueIndex - 1)
        set({ queueIndex: prevIdx, currentSong: queue[prevIdx] ?? null, progress: 0, currentTime: 0 })
      },

      seek: (pct) => set({ progress: pct }),

      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),
      setIsLoading: (loading) => set({ isLoading: loading }),

      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), isMuted: false }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),

      toggleShuffle: () => {
        const { shuffle, queue, queueIndex, originalQueue } = get()
        if (!shuffle) {
          // shuffle the remaining songs, keep current at index 0
          const current = queue[queueIndex]
          const rest = queue.filter((_, i) => i !== queueIndex)
          const shuffled = rest.sort(() => Math.random() - 0.5)
          const newQueue = current ? [current, ...shuffled] : shuffled
          set({ shuffle: true, queue: newQueue, queueIndex: 0 })
        } else {
          // restore original order, find current song's position
          const current = queue[queueIndex]
          const newIdx = current ? originalQueue.findIndex((s) => s.id === current.id) : 0
          set({ shuffle: false, queue: originalQueue, queueIndex: Math.max(0, newIdx) })
        }
      },

      cycleRepeat: () => {
        const { repeat } = get()
        const next: RepeatMode = repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none'
        set({ repeat: next })
      },

      addToQueue: (song) => set((s) => ({ queue: [...s.queue, song] })),

      removeFromQueue: (index) => {
        const { queue, queueIndex } = get()
        const newQueue = queue.filter((_, i) => i !== index)
        const newIdx = index < queueIndex ? queueIndex - 1 : queueIndex
        set({ queue: newQueue, queueIndex: Math.max(0, Math.min(newIdx, newQueue.length - 1)) })
      },

      reorderQueue: (from, to) => {
        const { queue } = get()
        const newQueue = [...queue]
        const [moved] = newQueue.splice(from, 1)
        if (moved) newQueue.splice(to, 0, moved)
        set({ queue: newQueue })
      },

      setQuality: (q) => set({ quality: q }),
      setShowQueue: (show) => set({ showQueue: show }),
      setShowLyrics: (show) => set({ showLyrics: show }),
    }),
    {
      name: 'player-prefs',
      // only persist user preferences, not playback state
      partialize: (s) => ({ volume: s.volume, quality: s.quality, repeat: s.repeat }),
    },
  ),
)
