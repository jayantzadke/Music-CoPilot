# Implementation Plan

## Overview

MVP music streaming app. Browse songs by language, search, view albums and artists, play songs. No auth. Backend proxies all music data through a generic `MusicApiService` that reads base URL from env — swap the provider tomorrow by changing one env var.

## Task Dependency Graph

```
BE-01 → BE-02 → BE-03
FE-01 → FE-02 → FE-03 → FE-04 → FE-05 → FE-06 → FE-07
                    ↑
                  BE-03
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["BE-01", "FE-01"] },
    { "wave": 2, "tasks": ["BE-02", "FE-02"] },
    { "wave": 3, "tasks": ["BE-03", "FE-03"] },
    { "wave": 4, "tasks": ["FE-04"] },
    { "wave": 5, "tasks": ["FE-05", "FE-06"] },
    { "wave": 6, "tasks": ["FE-07"] }
  ]
}
```

---

## Backend

### Task BE-01: Project Bootstrap

- [x] Fastify + TypeScript project initialized
- [x] `src/config/env.ts` — Zod-validated env, `MUSIC_API_URL` defaults to `https://saavn.sumit.co`
- [x] `src/config/db.ts` exists (not needed for MVP but keep)
- [x] `src/errors/index.ts` — AppError hierarchy exists
- [x] `src/server.ts` — Fastify instance with logger, CORS, global error handler

**Dependencies:** none

---

### Task BE-02: Music API Service

- [ ] Rename/replace `src/services/jiosaavn.ts` → `src/services/music.ts` exporting `MusicApiService` class (no JioSaavn references in class/method names)
- [ ] All API calls read base URL from `env.MUSIC_API_URL`
- [ ] Methods: `getModules(languages)`, `searchAll(query, page, limit)`, `searchSongs(query, page, limit)`, `searchAlbums(query, page, limit)`, `searchArtists(query, page, limit)`, `getSong(id)`, `getSongBatch(ids[])`, `getAlbum(id)`, `getArtist(id)`, `getLyrics(id)`
- [ ] `cachedFetch` unwraps `response.data` before caching
- [ ] All errors throw `ExternalAPIError`
- [ ] Cache service wired in (`src/services/cache.ts` already exists)

**Dependencies:** BE-01

---

### Task BE-03: Music + Search Routes

- [ ] `src/modules/music/music.controller.ts` — delegates to `MusicApiService` (update import from new music.ts)
- [ ] `src/modules/music/music.routes.ts` — routes: `GET /modules`, `GET /songs/:id`, `GET /songs/:id/lyrics`, `GET /albums/:id`, `GET /artists/:id`, `GET /artists/:id/songs`, `GET /artists/:id/albums`
- [ ] `src/modules/search/search.controller.ts` — delegates to `MusicApiService`
- [ ] `src/modules/search/search.routes.ts` — routes: `GET /` (all), `GET /songs`, `GET /albums`, `GET /artists`
- [ ] Register both route groups in `server.ts` under `/api/music` and `/api/search`
- [ ] Zod query param validation on all routes (query, page, limit, languages)
- [ ] No auth middleware on any of these routes

**Dependencies:** BE-02

---

## Frontend

### Task FE-01: Project Bootstrap

- [ ] Init Next.js 14 App Router project with TypeScript in `frontend/` directory
- [ ] Install dependencies: `tailwindcss`, `shadcn/ui`, `zustand`, `swr`, `howler`, `@types/howler`, `lucide-react`, `clsx`, `tailwind-merge`
- [ ] Configure Tailwind dark theme (Spotify-style dark palette: bg `#0a0a0a`, surface `#121212`, elevated `#1a1a1a`, accent `#1ed760`)
- [ ] Init shadcn/ui dark theme, install: `button`, `input`, `slider`, `skeleton`, `tabs`, `dropdown-menu`, `dialog`
- [ ] `next.config.ts` — add `c.saavncdn.com` and `saavn.sumit.co` to image domains, set `NEXT_PUBLIC_API_URL`
- [ ] Create `src/types/music.ts` — `Song`, `Album`, `Artist`, `SearchResults`, `HomeModules`, `AudioQuality` types
- [ ] Create `src/lib/utils.ts` — `formatDuration(seconds)`, `getImageUrl(images[], quality?)` (picks last = highest), `cn(...)`
- [ ] Create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001`

**Dependencies:** none

---

### Task FE-02: API Client + Player Store

- [ ] Create `src/lib/api.ts` — typed fetch client, base URL from `process.env.NEXT_PUBLIC_API_URL`
  - `getModules(languages: string)`
  - `searchAll(query, page?, limit?)`, `searchSongs(...)`, `searchAlbums(...)`, `searchArtists(...)`
  - `getSong(id)`, `getAlbum(id)`, `getArtist(id)`, `getLyrics(id)`
- [ ] Create `src/stores/playerStore.ts` — Zustand store:
  - State: `currentSong`, `queue`, `queueIndex`, `isPlaying`, `isLoading`, `progress`, `currentTime`, `duration`, `volume` (persisted), `isMuted`, `shuffle`, `repeat`
  - Actions: `playSong(song, queue?)`, `playQueue(songs, startIndex?)`, `togglePlay()`, `next()`, `previous()`, `seek(pct)`, `setVolume(v)`, `toggleMute()`, `addToQueue(song)`, `toggleShuffle()`, `cycleRepeat()`

**Dependencies:** FE-01

---

### Task FE-03: Audio Engine + Shell Layout

- [ ] Create `src/hooks/useAudio.ts` — Howler.js singleton:
  - Subscribes to `playerStore.currentSong`, loads `downloadUrl` array (last element = 320kbps)
  - Quality fallback chain on error: 320 → 160 → 96 → 48 → 12
  - Fires `timeupdate` to `playerStore` every 500ms
  - On song end → `playerStore.next()`
- [ ] Create `src/hooks/useMediaSession.ts` — sets `navigator.mediaSession` metadata on song change
- [ ] Create `src/app/(main)/layout.tsx`:
  - Sidebar (240px desktop, icon-only on tablet, hidden mobile) with nav links: Home, Search
  - `<main>` with `pb-24` for player bar clearance
  - `NowPlayingBar` fixed to bottom
  - Mounts `useAudio` and keyboard shortcuts (Space = play/pause, Ctrl+→ = next, Ctrl+← = prev, M = mute)

**Dependencies:** FE-02, BE-03

---

### Task FE-04: Now Playing Bar + Music Cards

- [ ] Create `src/components/player/NowPlayingBar.tsx` — fixed bottom bar, only renders when `currentSong != null`:
  - Left: song artwork (40×40), name, artist
  - Center: prev, play/pause (spinner when loading), next, progress bar (range input), time labels
  - Right: shuffle, repeat, volume slider, mute toggle
- [ ] Create `src/components/music/SongCard.tsx` — vertical card: artwork, name, artist, hover play overlay → `playerStore.playSong`
- [ ] Create `src/components/music/SongRow.tsx` — horizontal row: index, artwork, title, artist, album name, duration, play on click, highlight when playing
- [ ] Create `src/components/music/AlbumCard.tsx` — square card: cover, name, year, artist → navigates to `/album/[id]`
- [ ] Create `src/components/music/ArtistCard.tsx` — circle card: image, name → navigates to `/artist/[id]`
- [ ] Create `src/components/music/TrackList.tsx` — renders `Song[]` as `SongRow` list, passes full album as queue on click

**Dependencies:** FE-03

---

### Task FE-05: Home Page + Search Page

- [ ] Create `src/app/(main)/page.tsx` — home page:
  - Language filter bar (Hindi / English / Tamil / Telugu / Punjabi / All) — updates state, refetches
  - SWR fetch `/api/music/modules?languages=hindi`
  - Render horizontal scroll rows: Trending Songs (SongCard), New Releases (AlbumCard), Charts (AlbumCard), Top Artists (ArtistCard)
  - Skeleton placeholders while loading (3–4 cards per row)
- [ ] Create `src/app/(main)/search/page.tsx` + `src/app/(main)/search/[query]/page.tsx`:
  - Search input with 300ms debounce
  - Tabbed results: All | Songs | Albums | Artists
  - SongRow for songs, AlbumCard for albums, ArtistCard for artists
  - Empty state when no results

**Dependencies:** FE-04

---

### Task FE-06: Album + Artist Pages

- [ ] Create `src/app/(main)/album/[id]/page.tsx`:
  - Fetch `/api/music/albums/:id`
  - Hero: large artwork, title, artist link, year, track count, total duration
  - "Play All" button → `playerStore.playQueue(tracks)`
  - "Shuffle" button → shuffle then play
  - Full tracklist as `TrackList`
  - Skeleton while loading
- [ ] Create `src/app/(main)/artist/[id]/page.tsx`:
  - Fetch `/api/music/artists/:id`
  - Hero: artist image (circle, 200px), name, follower count
  - Top songs section: show 5 by default, "Show more" expands to 20
  - Discography: horizontal AlbumCard grid
  - Skeleton while loading

**Dependencies:** FE-04

---

### Task FE-07: Error States + Polish

- [ ] `src/app/not-found.tsx` — 404 page
- [ ] `src/app/error.tsx` — error boundary
- [ ] Empty state component — used on search no-results, empty sections
- [ ] Toast on API errors (use `sonner`) — shown when any fetch fails
- [ ] Offline banner — `navigator.onLine` watcher, shows "No internet connection" strip
- [ ] Skeleton variants for SongRow, AlbumCard, ArtistCard, SongCard

**Dependencies:** FE-05, FE-06

---

## Notes

- `MusicApiService` replaces `JioSaavnService` — all internal references use generic names (`getModules`, `getSong`, etc.)
- `MUSIC_API_URL` in env — change this one var to point at any compatible music API
- No database queries needed for MVP — backend is purely a caching proxy
- Redis cache is optional for MVP — if `REDIS_URL` is not set, `CacheService` should fall through to direct fetch
