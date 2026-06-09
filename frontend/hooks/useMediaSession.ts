'use client'

import { useEffect } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { getImageUrl } from '@/lib/utils'

export function useMediaSession() {
  const { currentSong, isPlaying, next, previous, togglePlay } = usePlayerStore()

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.name,
      artist: currentSong.primaryArtists,
      album: currentSong.album.name,
      artwork: [
        { src: getImageUrl(currentSong.image, '150x150'), sizes: '150x150', type: 'image/jpeg' },
        { src: getImageUrl(currentSong.image, '500x500'), sizes: '500x500', type: 'image/jpeg' },
      ],
    })

    navigator.mediaSession.setActionHandler('play', togglePlay)
    navigator.mediaSession.setActionHandler('pause', togglePlay)
    navigator.mediaSession.setActionHandler('nexttrack', next)
    navigator.mediaSession.setActionHandler('previoustrack', previous)

    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
    }
  }, [currentSong, isPlaying, next, previous, togglePlay])
}
