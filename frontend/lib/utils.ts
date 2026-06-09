import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ImageItem, AudioQuality } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatPlayCount(count: string | number): string {
  const n = Number(count)
  if (isNaN(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// picks the best available image quality
export function getImageUrl(images: ImageItem[], preferred: '50x50' | '150x150' | '500x500' = '150x150'): string {
  if (!images?.length) return '/placeholder-music.png'
  const found = images.find((img) => img.quality === preferred)
  return found?.url ?? images[images.length - 1]?.url ?? '/placeholder-music.png'
}

export function getStreamUrl(downloadUrls: Array<{ quality: AudioQuality; url: string }>, quality: AudioQuality): string | null {
  const found = downloadUrls?.find((d) => d.quality === quality)
  return found?.url ?? null
}

// fallback chain for stream urls — tries highest quality first
export function getFallbackUrls(
  downloadUrls: Array<{ quality: AudioQuality; url: string }>,
  preferred: AudioQuality,
): string[] {
  const order: AudioQuality[] = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps']
  const startIdx = order.indexOf(preferred)
  const priorities = startIdx >= 0 ? order.slice(startIdx) : order

  return priorities
    .map((q) => downloadUrls?.find((d) => d.quality === q)?.url)
    .filter((url): url is string => Boolean(url))
}

export function getArtistNames(artists: { primary?: Array<{ name: string }> } | undefined): string {
  return artists?.primary?.map((a) => a.name).join(', ') ?? 'Unknown Artist'
}
