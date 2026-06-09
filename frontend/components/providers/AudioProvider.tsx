'use client'

import { useAudio } from '@/hooks/useAudio'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

// mounts the audio engine + keyboard shortcuts once at the top of the main layout
export function AudioProvider({ children }: { children: React.ReactNode }) {
  useAudio()
  useKeyboardShortcuts()
  return <>{children}</>
}
