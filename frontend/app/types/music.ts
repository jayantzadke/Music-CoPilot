// canonical types live in /types — this file re-exports for any code that
// imports from @/app/types/music rather than @/types directly
export type {
  AudioQuality,
  DownloadUrl,
  ImageItem,
  Song,
  Album,
  Artist,
  JioSaavnPlaylist,
  HomeModule,
  HomeModules,
} from '@/types'

import type { Song, Album, Artist } from '@/types'

export interface SearchResults {
  songs?: { results: Song[]; total: number }
  albums?: { results: Album[]; total: number }
  artists?: { results: Artist[]; total: number }
}
