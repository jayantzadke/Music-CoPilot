'use client'

import { useEffect } from 'react'
import { usePlayerStore } from '@/stores/playerStore'
import { useLibraryStore } from '@/stores/libraryStore'

export function useKeyboardShortcuts() {
  const { togglePlay, next, previous, toggleMute, currentSong } = usePlayerStore()
  const { toggleLike } = useLibraryStore()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      // don't intercept when user is typing
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.ctrlKey && e.code === 'ArrowRight') {
        e.preventDefault()
        next()
      } else if (e.ctrlKey && e.code === 'ArrowLeft') {
        e.preventDefault()
        previous()
      } else if (e.code === 'KeyM') {
        toggleMute()
      } else if (e.code === 'KeyL' && currentSong) {
        toggleLike(currentSong)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [togglePlay, next, previous, toggleMute, toggleLike, currentSong])
}
