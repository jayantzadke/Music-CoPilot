'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { getFallbackUrls } from '@/lib/utils'
import { useMediaSession } from './useMediaSession'
import { toast } from 'sonner'

// module-level singleton — survives route changes, never creates a second audio element
let globalAudio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement {
  if (!globalAudio) {
    globalAudio = new Audio()
    globalAudio.preload = 'metadata'
  }
  return globalAudio
}

export function useAudio() {
  const urlIndexRef    = useRef(0)
  const fallbackUrlsRef = useRef<string[]>([])
  const mountedRef     = useRef(false)

  const {
    currentSong,
    isPlaying,
    quality,
    volume,
    isMuted,
    progress,
    setCurrentTime,
    setDuration,
    setIsLoading,
    next,
  } = usePlayerStore()

  useMediaSession()

  // wire events once per mount — if already wired by a previous mount, skip
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const audio = getAudio()

    const onTimeUpdate     = () => usePlayerStore.getState().setCurrentTime(audio.currentTime)
    const onDurationChange = () => usePlayerStore.getState().setDuration(audio.duration || 0)
    const onWaiting        = () => usePlayerStore.getState().setIsLoading(true)
    const onCanPlay        = () => usePlayerStore.getState().setIsLoading(false)
    const onEnded          = () => usePlayerStore.getState().next()

    const onError = () => {
      urlIndexRef.current += 1
      const nextUrl = fallbackUrlsRef.current[urlIndexRef.current]
      if (nextUrl) {
        audio.src = nextUrl
        audio.play().catch(() => null)
      } else {
        toast.error("couldn't load this track, skipping")
        usePlayerStore.getState().next()
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    // no cleanup — we want these listeners to persist for the lifetime of the app
  }, [])

  // song change — load new src
  useEffect(() => {
    const audio = getAudio()
    if (!currentSong) return

    const urls = getFallbackUrls(currentSong.downloadUrl, quality)
    fallbackUrlsRef.current = urls
    urlIndexRef.current = 0

    const firstUrl = urls[0]
    if (!firstUrl) {
      toast.error('no stream url for this track')
      next()
      return
    }

    // stop whatever is playing before loading new track
    audio.pause()
    audio.src = firstUrl

    if (isPlaying) {
      audio.play().catch(() => null)
    }
  }, [currentSong?.id])

  // play/pause
  useEffect(() => {
    const audio = getAudio()
    if (!currentSong) return
    if (isPlaying) {
      audio.play().catch(() => null)
    } else {
      audio.pause()
    }
  }, [isPlaying])

  // seek
  useEffect(() => {
    const audio = getAudio()
    if (!audio.duration) return
    const targetTime = progress * audio.duration
    if (Math.abs(audio.currentTime - targetTime) > 1) {
      audio.currentTime = targetTime
    }
  }, [progress])

  // volume
  useEffect(() => {
    const audio = getAudio()
    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])
}
