'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { apiClient } from '@/lib/api'
import type { Song } from '@/types'

export function useLikeButton(song: Song) {
  const user = useAuthStore((s) => s.user)
  const { isLiked, toggleLike } = useLibraryStore()
  const [isLoading, setIsLoading] = useState(false)

  const liked = song?.id ? isLiked(song.id) : false

  const toggle = async () => {
    if (!song?.id) return
    if (!user) {
      // guest — just update localStorage
      toggleLike(song)
      return
    }

    setIsLoading(true)
    try {
      if (liked) {
        await apiClient.library.unlikeSong(song.id)
      } else {
        await apiClient.library.likeSong({
          songId: song.id,
          songName: song.name,
          songImage: song.image?.[1]?.url ?? null,
          songArtists: song.primaryArtists,
          songDuration: song.duration,
          albumId: song.album?.id ?? null,
        })
      }
      // keep local state in sync so the UI updates instantly
      toggleLike(song)
    } catch {
      // api call failed but local state was already updated — that's fine
    } finally {
      setIsLoading(false)
    }
  }

  return { isLiked: liked, toggle, isLoading }
}
