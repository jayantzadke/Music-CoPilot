'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { getFallbackUrls } from '@/lib/utils'
import { useMediaSession } from './useMediaSession'
import { toast } from 'sonner'

const QUALITY_FALLBACK_ORDER = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps'] as const

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const urlIndexRef = useRef(0)
  const fallbackUrlsRef = useRef<string[]>([])

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

  // create audio element once
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.preload = 'metadata'

    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  // wire up audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onWaiting = () => setIsLoading(true)
    const onCanPlay = () => setIsLoading(false)
    const onEnded = () => next()

    const onError = () => {
      // try next quality fallback
      urlIndexRef.current += 1
      const nextUrl = fallbackUrlsRef.current[urlIndexRef.current]
      if (nextUrl) {
        audio.src = nextUrl
        audio.play().catch(() => null)
      } else {
        toast.error(`couldn't load this track, skipping`)
        next()
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [setCurrentTime, setDuration, setIsLoading, next])

  // handle song changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    const urls = getFallbackUrls(currentSong.downloadUrl, quality)
    fallbackUrlsRef.current = urls
    urlIndexRef.current = 0

    const firstUrl = urls[0]
    if (!firstUrl) {
      toast.error(`no stream url for this track`)
      next()
      return
    }

    audio.src = firstUrl
    if (isPlaying) {
      audio.play().catch(() => null)
    }
  }, [currentSong?.id]) // only re-run when song actually changes

  // handle play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentSong) return

    if (isPlaying) {
      audio.play().catch(() => null)
    } else {
      audio.pause()
    }
  }, [isPlaying, currentSong])

  // handle seek
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const targetTime = progress * audio.duration
    if (Math.abs(audio.currentTime - targetTime) > 1) {
      audio.currentTime = targetTime
    }
  }, [progress])

  // volume
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  return { audioRef }
}
