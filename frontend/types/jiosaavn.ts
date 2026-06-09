export type AudioQuality = '12kbps' | '48kbps' | '96kbps' | '160kbps' | '320kbps'
export type RepeatMode = 'none' | 'one' | 'all'
export type Language = 'hindi' | 'english' | 'tamil' | 'telugu' | 'punjabi'
export type ContentType = 'song' | 'album' | 'artist' | 'playlist'

export interface ImageItem {
  quality: string
  url: string
}

export interface DownloadUrl {
  quality: AudioQuality
  url: string
}

export interface Artist {
  id: string
  name: string
  type: 'artist'
  url: string
  image: ImageItem[]
  followerCount?: string
  fanCount?: string
  isVerified?: boolean
  dominantLanguage?: string
  dominantType?: string
  bio?: Array<{ text: string; title: string; sequence: string }>
  dob?: string
  availableLanguages?: string[]
  isRadioPresent?: boolean
  topSongs?: Song[]
  topAlbums?: Album[]
}

export interface Song {
  id: string
  name: string
  type: 'song'
  year: string
  releaseDate: string
  duration: number
  label: string
  primaryArtists: string
  primaryArtistsId: string
  featuredArtists: string
  explicitContent: boolean
  playCount: string
  language: string
  hasLyrics: boolean
  url: string
  copyright: string
  image: ImageItem[]
  downloadUrl: DownloadUrl[]
  album: { id: string; name: string; url: string }
  artists: { primary: Artist[]; featured: Artist[]; all: Artist[] }
  lyrics?: { lyrics: string; snippet: string; copyright: string }
}

export interface Album {
  id: string
  name: string
  type: 'album'
  year: string
  releaseDate: string
  playCount: string
  language: string
  explicitContent: boolean
  url: string
  image: ImageItem[]
  artists: { primary: Artist[]; featured: Artist[]; all: Artist[] }
  songs: Song[]
}

export interface JioSaavnPlaylist {
  id: string
  name: string
  type: 'playlist'
  url: string
  image: ImageItem[]
  songCount: number
  songs: Song[]
  description?: string
}

export interface HomeModule {
  title: string
  type: ContentType
  data: Array<Song | Album | Artist | JioSaavnPlaylist>
}

export type HomeModules = HomeModule[]
