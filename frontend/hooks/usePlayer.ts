'use client'

import { usePlayerStore } from '@/stores/playerStore'
import { formatDuration } from '@/lib/utils'

export function usePlayer() {
  const store = usePlayerStore()

  return {
    currentSong:       store.currentSong,
    queue:             store.queue,
    queueIndex:        store.queueIndex,
    isPlaying:         store.isPlaying,
    isLoading:         store.isLoading,
    progress:          store.progress,
    currentTime:       store.currentTime,
    duration:          store.duration,
    volume:            store.volume,
    isMuted:           store.isMuted,
    quality:           store.quality,
    shuffle:           store.shuffle,
    repeat:            store.repeat,
    showQueue:         store.showQueue,
    showLyrics:        store.showLyrics,

    isCurrentSong:     (id: string) => store.currentSong?.id === id,
    progressPct:       store.duration > 0 ? (store.currentTime / store.duration) * 100 : 0,
    formattedTime:     formatDuration(store.currentTime),
    formattedDuration: formatDuration(store.duration),

    play:           store.togglePlay,
    next:           store.next,
    previous:       store.previous,
    seek:           store.seek,
    setVolume:      store.setVolume,
    toggleMute:     store.toggleMute,
    toggleShuffle:  store.toggleShuffle,
    cycleRepeat:    store.cycleRepeat,
    playSong:       store.playSong,
    playQueue:      store.playQueue,
    addToQueue:     store.addToQueue,
    removeFromQueue:store.removeFromQueue,
    setQuality:     store.setQuality,
    setShowQueue:   store.setShowQueue,
    setShowLyrics:  store.setShowLyrics,
  }
}
