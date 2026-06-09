# Requirements Document

## Introduction

Saavn Clone is a full-stack music streaming web application modelled after Spotify's UI/UX,
powered by the JioSaavn unofficial API (saavn.dev). It provides Indian-music-first discovery,
playback, and library management for both authenticated and guest users. The backend runs on
Fastify 4 / Node.js 20 with PostgreSQL (Neon) and Redis (Upstash); the frontend on Next.js 14
App Router with TypeScript, Tailwind CSS, Zustand, and Howler.

All code must conform to Google Staff Engineer standards as defined in
`.kiro/skills/google-staff-engineer.md`: strict TypeScript, Zod validation at every boundary,
layered architecture (Route → Controller → Service → Repository), a custom error hierarchy,
no magic values, and JSDoc on all exports.

---

## Glossary

- **System**: The Saavn Clone web application (frontend + backend) taken as a whole.
- **Frontend**: The Next.js 14 App Router application deployed to Vercel.
- **Backend**: The Fastify 4 / Node.js 20 API server deployed to Railway.
- **Database**: The PostgreSQL instance hosted on Neon, accessed via Drizzle ORM.
- **Cache**: The Redis instance hosted on Upstash, used for API response caching.
- **JioSaavn_API**: The unofficial JioSaavn REST API at saavn.dev used for music catalogue data.
- **Player**: The in-app audio playback engine backed by Howler.js and managed by `playerStore`.
- **Queue**: The ordered list of songs scheduled for sequential playback within a session.
- **Library**: The authenticated user's personal collection of liked songs, followed artists,
  and self-created playlists.
- **Guest_User**: An unauthenticated visitor who can browse and play music; personal data
  is persisted to `localStorage`.
- **Authenticated_User**: A registered user who has completed login and holds a valid JWT
  access token.
- **Access_Token**: A short-lived JWT (15-minute expiry) transmitted as a Bearer token in the
  `Authorization` header.
- **Refresh_Token**: A long-lived opaque token (30-day expiry) stored in an httpOnly cookie,
  used to obtain new Access_Tokens without re-authentication.
- **Audio_Quality**: One of the five JioSaavn bitrate tiers — `12kbps`, `48kbps`, `96kbps`,
  `160kbps`, or `320kbps`.
- **Playlist**: A named, user-owned ordered collection of songs stored in the Database.
- **Play_History**: A per-user log of the last 500 songs played, stored in the Database for
  Authenticated_Users and in `localStorage` for Guest_Users.
- **Search_History**: A per-user log of the last 20 search queries, stored in the Database for
  Authenticated_Users.
- **Media_Session**: The browser Media Session API used for OS-level playback controls and
  lock-screen metadata.
- **Skeleton**: A placeholder UI element rendered in place of real content while data loads.
- **PWA**: Progressive Web App — the application's installable, offline-capable shell.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a visitor, I want to create an account with email and password,
so that I can access personalised features like playlists and liked songs.

#### Acceptance Criteria

1. WHEN a visitor submits a valid registration form with a unique email address and a password
   of at least 8 characters, THE Backend SHALL create a new user record, hash the password with
   bcrypt (cost factor ≥ 12), and return a 201 response containing a safe user object
   (no `passwordHash` field).
2. WHEN a visitor submits a registration form with an email address that already exists in the
   Database, THE Backend SHALL return a 409 Conflict error with error code `CONFLICT`.
3. WHEN a visitor submits a registration form with a password shorter than 8 characters,
   THE Backend SHALL return a 400 Validation error with error code `VALIDATION` before
   attempting any Database write.
4. WHEN a visitor submits a registration form with a malformed email address, THE Backend
   SHALL return a 400 Validation error with error code `VALIDATION`.
5. THE Backend SHALL validate all registration inputs using a Zod schema before processing.

---

### Requirement 2: User Login

**User Story:** As a registered user, I want to log in with my email and password,
so that I can access my personal library and preferences.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits valid credentials, THE Backend SHALL return a 200
   response containing an Access_Token (JWT, 15-minute expiry), set a `refreshToken` httpOnly
   cookie (30-day expiry, `SameSite=Strict`, `Secure` in production), and return a safe user
   object.
2. WHEN a user submits incorrect credentials, THE Backend SHALL return a 401 Unauthorized error
   with error code `UNAUTHORIZED` without revealing whether the email or password was wrong.
3. WHEN an unauthenticated request is made to a protected endpoint, THE Backend SHALL return a
   401 Unauthorized error with error code `UNAUTHORIZED`.
4. THE Backend SHALL rate-limit the login endpoint to 5 requests per minute per IP address,
   returning a 429 response with a `Retry-After` header on excess requests.
5. THE Backend SHALL validate all login inputs using a Zod schema before querying the Database.

---

### Requirement 3: Token Refresh and Logout

**User Story:** As an authenticated user, I want my session to stay active without re-entering
my password, and I want to securely end my session when I choose to log out.

#### Acceptance Criteria

1. WHEN an Authenticated_User sends a valid `refreshToken` cookie to the `/auth/refresh`
   endpoint, THE Backend SHALL issue a new Access_Token and rotate the Refresh_Token
   (invalidate the old one, issue a new one).
2. WHEN a Refresh_Token has been previously revoked or does not exist in the Database, THE
   Backend SHALL return a 401 Unauthorized error with error code `UNAUTHORIZED`.
3. WHEN an Authenticated_User calls the `/auth/logout` endpoint, THE Backend SHALL revoke the
   current Refresh_Token in the Database and clear the `refreshToken` httpOnly cookie.
4. WHEN an Authenticated_User changes their password, THE Backend SHALL revoke all existing
   Refresh_Tokens for that user in the Database.

---

### Requirement 4: Profile Management

**User Story:** As an authenticated user, I want to update my display name, avatar, language
preference, and audio quality setting, so that my experience matches my preferences.

#### Acceptance Criteria

1. WHEN an Authenticated_User submits a valid profile update request, THE Backend SHALL update
   the specified fields (display name, avatar URL, language preference, preferred Audio_Quality)
   in the Database and return the updated safe user object.
2. WHEN an Authenticated_User submits a display name shorter than 1 character or longer than
   50 characters, THE Backend SHALL return a 400 Validation error with error code `VALIDATION`.
3. WHEN an Authenticated_User submits a change-password request with a correct current password
   and a new password of at least 8 characters, THE Backend SHALL update the hashed password
   and revoke all existing Refresh_Tokens for that user.
4. WHEN an Authenticated_User submits a change-password request with an incorrect current
   password, THE Backend SHALL return a 401 Unauthorized error with error code `UNAUTHORIZED`.
5. THE Backend SHALL validate all profile update inputs using Zod schemas before processing.
6. THE Backend SHALL never return the `passwordHash` field in any profile-related response.

---

### Requirement 5: Music Discovery — Home Page

**User Story:** As a user, I want a home page that shows trending content, featured playlists,
new releases, and top artists, so that I can discover new music without searching.

#### Acceptance Criteria

1. WHEN a user navigates to the home page, THE Frontend SHALL display at least the following
   sections: Trending Songs, Featured Playlists, New Releases, and Top Artists.
2. WHEN the home page loads, THE Backend SHALL fetch data from the JioSaavn_API `/modules`
   endpoint and cache the response in the Cache with a TTL of 1 hour.
3. WHEN a cached home page response exists in the Cache, THE Backend SHALL serve it without
   calling the JioSaavn_API.
4. WHEN a user selects a language filter (Hindi, English, Tamil, Telugu, or Punjabi), THE
   Frontend SHALL reload the discovery sections showing content matching the selected language.
5. WHILE content is loading, THE Frontend SHALL display Skeleton placeholders for each
   content section.
6. WHEN the JioSaavn_API is unreachable, THE Backend SHALL return a 502 error with error code
   `EXTERNAL_API`, and THE Frontend SHALL display a toast notification with a retry button.

---

### Requirement 6: Global Search

**User Story:** As a user, I want to search for songs, albums, artists, and playlists by
keyword, so that I can quickly find specific music.

#### Acceptance Criteria

1. WHEN a user types in the global search input, THE Frontend SHALL debounce the query by
   300 milliseconds before dispatching a search request.
2. WHEN a debounced search query of at least 2 characters is dispatched, THE Frontend SHALL
   display a dropdown with up to 5 suggestion results per content type (songs, albums, artists).
3. WHEN a user navigates to the full search results page, THE Frontend SHALL display results
   organised into tabs: All, Songs, Albums, Artists, Playlists.
4. WHEN a user scrolls to the bottom of a search results tab, THE Frontend SHALL fetch the
   next page of results and append them to the current list (infinite scroll).
5. WHEN a user applies a language filter on the search results page, THE Backend SHALL return
   only results matching the selected language.
6. WHEN an Authenticated_User submits a search query, THE Backend SHALL record the query in
   the user's Search_History, keeping only the 20 most recent distinct entries.
7. WHEN an Authenticated_User views their search history, THE Backend SHALL return the last
   20 queries in reverse-chronological order.
8. WHEN the search query is empty, THE Frontend SHALL hide the suggestions dropdown and display
   the user's Search_History (for Authenticated_Users) or a prompt to start searching.
9. THE Backend SHALL cache JioSaavn_API search responses in the Cache with a TTL of 5 minutes,
   keyed by query string and language filter.

---

### Requirement 7: Music Playback

**User Story:** As a user, I want to stream songs with full playback controls, so that I can
listen to music seamlessly without interruptions.

#### Acceptance Criteria

1. WHEN a user selects a song to play, THE Player SHALL fetch the song's download URL from
   the JioSaavn_API at the user's preferred Audio_Quality (default 320kbps) and begin
   streaming immediately.
2. WHEN a stream URL request fails for the current Audio_Quality, THE Player SHALL
   automatically retry at the next lower quality tier in the order: 320kbps → 160kbps →
   96kbps → 48kbps → 12kbps.
3. IF all quality tiers fail to load, THEN THE Frontend SHALL display a toast error and
   advance the Player to the next song in the Queue.
4. WHILE a song is playing, THE Frontend SHALL display a persistent now-playing bar fixed to
   the page footer, showing song artwork, title, and artist name.
5. THE Player SHALL support the following controls: play/pause toggle, next song, previous
   song, seek to position, volume adjustment, and mute toggle.
6. WHEN a user activates shuffle mode, THE Player SHALL randomise the remaining Queue while
   preserving a backup of the original Queue order for deactivation.
7. WHEN a user deactivates shuffle mode, THE Player SHALL restore the Queue to the original
   pre-shuffle order.
8. THE Player SHALL support three repeat modes: `none` (stop after queue ends), `one` (repeat
   current song), and `all` (repeat entire Queue).
9. WHEN a song's lyrics are available from the JioSaavn_API, THE Frontend SHALL display them
   in a lyrics panel accessible from the now-playing bar.
10. WHEN a song begins playing, THE Frontend SHALL update the browser's Media_Session metadata
    (title, artist, artwork) and register handlers for play, pause, next, and previous actions.
11. THE Frontend SHALL support the following keyboard shortcuts: `Space` (play/pause),
    `Ctrl+Right` (next), `Ctrl+Left` (previous), `M` (mute toggle), `L` (like toggle).
12. WHEN an Authenticated_User begins playing a song, THE Backend SHALL record the play event
    in Play_History as a fire-and-forget operation that does not block playback.

---

### Requirement 8: Queue Management

**User Story:** As a user, I want to view and manage the playback queue, so that I can control
the order in which songs play.

#### Acceptance Criteria

1. WHEN a user opens the Queue panel, THE Frontend SHALL display all songs currently in the
   Queue in their current playback order, with the currently playing song highlighted.
2. WHEN a user removes a song from the Queue, THE Player SHALL remove that song without
   interrupting the currently playing song.
3. WHEN a user adds a song to the Queue, THE Player SHALL append the song to the end of the
   Queue.
4. WHEN a user reorders songs in the Queue via drag-and-drop, THE Player SHALL immediately
   reflect the new order.
5. WHEN shuffle mode is active and a user reorders the Queue, THE Player SHALL apply the
   reorder to the shuffled view and update the backup Queue accordingly.

---

### Requirement 9: User Library — Liked Songs

**User Story:** As a user, I want to like and unlike songs, so that I can build a personal
collection of favourite tracks.

#### Acceptance Criteria

1. WHEN an Authenticated_User likes a song, THE Backend SHALL insert a record into the
   `liked_songs` table with the song's denormalised metadata (id, name, image URL,
   primary artists, duration, Audio_Quality download URLs) and return a 201 response.
2. WHEN an Authenticated_User unlikes a previously liked song, THE Backend SHALL delete the
   corresponding record from `liked_songs` and return a 200 response.
3. WHEN an Authenticated_User requests their liked songs, THE Backend SHALL return a paginated
   list ordered by like timestamp descending.
4. WHEN a Guest_User likes a song, THE Frontend SHALL persist the liked song to `localStorage`
   and display the liked state immediately without a Backend call.
5. WHEN a Guest_User converts to an Authenticated_User (completes sign-up or login), THE
   Frontend SHALL prompt the user to import their locally liked songs to the Backend.
6. WHEN an Authenticated_User likes a song that is already liked, THE Backend SHALL return a
   409 Conflict error with error code `CONFLICT` without creating a duplicate record.

---

### Requirement 10: User Library — Play History

**User Story:** As a user, I want my play history recorded automatically, so that I can
revisit songs I have listened to.

#### Acceptance Criteria

1. WHEN an Authenticated_User plays a song, THE Backend SHALL append a record to
   `play_history` containing the song's denormalised metadata and the UTC timestamp.
2. WHEN the number of play history entries for an Authenticated_User exceeds 500, THE Backend
   SHALL delete the oldest entries so that no more than 500 entries exist per user.
3. WHEN an Authenticated_User requests their play history, THE Backend SHALL return a paginated
   list ordered by play timestamp descending.
4. WHEN a Guest_User plays a song, THE Frontend SHALL store the play event in `localStorage`,
   retaining a maximum of 50 entries.

---

### Requirement 11: User Library — Followed Artists

**User Story:** As an authenticated user, I want to follow and unfollow artists, so that I can
track artists whose music I enjoy.

#### Acceptance Criteria

1. WHEN an Authenticated_User follows an artist, THE Backend SHALL insert a record into the
   `followed_artists` table with the artist's denormalised metadata (id, name, image URL)
   and return a 201 response.
2. WHEN an Authenticated_User unfollows an artist, THE Backend SHALL delete the record from
   `followed_artists` and return a 200 response.
3. WHEN an Authenticated_User requests their followed artists, THE Backend SHALL return a
   paginated list ordered by follow timestamp descending.
4. WHEN an Authenticated_User follows an artist that is already followed, THE Backend SHALL
   return a 409 Conflict error with error code `CONFLICT` without creating a duplicate record.

---

### Requirement 12: Playlist Creation and Management

**User Story:** As an authenticated user, I want to create and manage personal playlists,
so that I can organise my favourite songs into curated collections.

#### Acceptance Criteria

1. WHEN an Authenticated_User creates a playlist with a name between 1 and 200 characters,
   THE Backend SHALL insert a new record into the `playlists` table and return a 201
   response containing the created playlist object.
2. WHEN an Authenticated_User attempts to create a playlist with a name exceeding 200
   characters, THE Backend SHALL return a 400 Validation error with error code `VALIDATION`.
3. WHEN an Authenticated_User updates a playlist's name, description, or public/private
   visibility, THE Backend SHALL update the record only if the requesting user owns the
   playlist, and return the updated playlist object.
4. WHEN an Authenticated_User attempts to update a playlist they do not own, THE Backend
   SHALL return a 403 Forbidden error with error code `FORBIDDEN`.
5. WHEN an Authenticated_User deletes a playlist, THE Backend SHALL delete the playlist and
   all associated `playlist_songs` records only if the requesting user owns the playlist.
6. WHEN an Authenticated_User adds a song to a playlist, THE Backend SHALL insert a record
   into `playlist_songs` with the song's denormalised metadata and assign the next sequential
   position value, provided the song is not already in the playlist and the total song count
   does not exceed 500.
7. WHEN an Authenticated_User attempts to add a duplicate song to a playlist, THE Backend
   SHALL return a 409 Conflict error with error code `CONFLICT`.
8. WHEN an Authenticated_User attempts to add a song to a playlist that already contains 500
   songs, THE Backend SHALL return a 400 Validation error with error code `VALIDATION`.
9. WHEN an Authenticated_User removes a song from a playlist, THE Backend SHALL delete the
   `playlist_songs` record and re-sequence positions of remaining songs only if the requesting
   user owns the playlist.
10. WHEN an Authenticated_User reorders songs in a playlist, THE Backend SHALL update the
    `position` values of affected `playlist_songs` records atomically within a single
    database transaction.
11. WHEN an unauthenticated or non-owner request is made to view a playlist marked as public,
    THE Backend SHALL return the playlist metadata and song list with a 200 response.
12. WHEN a request is made to view a playlist marked as private by a non-owner, THE Backend
    SHALL return a 403 Forbidden error with error code `FORBIDDEN`.

---

### Requirement 13: Album Detail Page

**User Story:** As a user, I want to view a full album page with artwork, metadata, and the
complete tracklist, so that I can explore and play an entire album.

#### Acceptance Criteria

1. WHEN a user navigates to an album detail page, THE Frontend SHALL display the album
   artwork, title, artist name, release year, and full tracklist fetched from the
   JioSaavn_API.
2. WHEN a user clicks "Play All" on an album, THE Player SHALL replace the current Queue with
   all tracks from that album in their album order and begin playback from the first track.
3. WHEN the album detail page loads, THE Backend SHALL cache the JioSaavn_API album response
   in the Cache with a TTL of 1 hour.
4. WHILE the album detail page is loading, THE Frontend SHALL display Skeleton placeholders
   for artwork, metadata, and tracklist rows.
5. WHEN the JioSaavn_API returns related album suggestions, THE Frontend SHALL display them in
   a "You may also like" section below the tracklist.

---

### Requirement 14: Artist Detail Page

**User Story:** As a user, I want to view an artist's profile with their top songs,
discography, and featured playlists, so that I can explore an artist's full catalogue.

#### Acceptance Criteria

1. WHEN a user navigates to an artist detail page, THE Frontend SHALL display the artist's
   header image, name, follower count, and top 5 songs fetched from the JioSaavn_API.
2. WHEN a user clicks "Show more" on the top songs section, THE Frontend SHALL expand the list
   to show up to 20 songs.
3. WHEN a user navigates to an artist detail page, THE Frontend SHALL display the artist's
   discography (albums and singles) in a horizontally scrollable section.
4. WHEN a user navigates to an artist detail page, THE Frontend SHALL display featured
   playlists associated with the artist in a horizontally scrollable section.
5. WHEN an Authenticated_User clicks the follow button on an artist page, THE Frontend SHALL
   call the follow endpoint and update the button state to "Following".
6. WHEN an Authenticated_User clicks the unfollow button on an artist page, THE Frontend SHALL
   call the unfollow endpoint and update the button state to "Follow".
7. WHEN the artist detail page loads, THE Backend SHALL cache the JioSaavn_API artist response
   in the Cache with a TTL of 1 hour.

---

### Requirement 15: Playlist Detail Page

**User Story:** As a user, I want to view a playlist's cover, metadata, and song list,
so that I can browse and play the playlist.

#### Acceptance Criteria

1. WHEN a user navigates to a public playlist detail page, THE Frontend SHALL display the
   playlist cover, name, description, owner display name, song count, and the full song list.
2. WHEN an Authenticated_User navigates to their own private playlist detail page, THE
   Frontend SHALL display all playlist metadata and an edit button.
3. WHEN a non-owner navigates to a private playlist detail page, THE Frontend SHALL redirect
   to a 403 page.
4. WHILE the playlist detail page is loading, THE Frontend SHALL display Skeleton placeholders
   for the cover, metadata, and song list rows.

---

### Requirement 16: Guest Experience

**User Story:** As a guest user, I want to browse and play music without creating an account,
so that I can evaluate the application before committing to registration.

#### Acceptance Criteria

1. THE Frontend SHALL allow any Guest_User to browse the home page, search results, album
   pages, artist pages, and public playlist pages without authentication.
2. THE Player SHALL allow any Guest_User to stream audio without authentication.
3. WHEN a Guest_User likes a song, THE Frontend SHALL store the liked state in `localStorage`
   and display the liked indicator without requiring a Backend call.
4. WHEN a Guest_User attempts to create or save a playlist, THE Frontend SHALL display a modal
   prompting the user to register or log in.
5. WHEN a Guest_User's locally liked songs or play history exist in `localStorage` and the
   user completes sign-up or login, THE Frontend SHALL offer a one-time prompt to import the
   local data to the Backend.

---

### Requirement 17: Performance and Core Web Vitals

**User Story:** As a user, I want the application to load quickly and respond instantly to
interactions, so that my listening experience is uninterrupted.

#### Acceptance Criteria

1. THE Frontend SHALL achieve a Largest Contentful Paint (LCP) of less than 2.5 seconds on a
   simulated 4G connection for the home page and album/artist detail pages.
2. THE Frontend SHALL achieve an Interaction to Next Paint (INP) of less than 100 milliseconds
   for all interactive controls (play/pause, like, search input).
3. THE Frontend SHALL achieve a Cumulative Layout Shift (CLS) score of less than 0.1 on all
   pages.
4. WHEN a list contains more than 30 items, THE Frontend SHALL render it using a virtualised
   list component (`@tanstack/react-virtual`) to avoid rendering off-screen DOM nodes.
5. THE Frontend SHALL use `next/image` for all image rendering to ensure automatic optimisation,
   lazy loading, and correct sizing.
6. THE Backend SHALL cache all JioSaavn_API responses in the Cache; cache keys SHALL include
   the endpoint path and all query parameters.

---

### Requirement 18: Progressive Web App (PWA)

**User Story:** As a mobile user, I want to install the application on my device and use the
app shell while offline, so that I have a native-like experience.

#### Acceptance Criteria

1. THE Frontend SHALL be installable as a PWA on desktop and mobile browsers that support the
   Web App Manifest standard.
2. WHEN a user installs the PWA and opens the application while offline, THE Frontend SHALL
   render the application shell (navigation, player bar) from the service worker cache.
3. WHEN an installed PWA user navigates to a page that requires network data while offline, THE
   Frontend SHALL display an offline placeholder with a message indicating no connectivity.

---

### Requirement 19: Error Handling and Resilience

**User Story:** As a user, I want the application to gracefully handle errors and network
issues, so that failures do not break my listening session.

#### Acceptance Criteria

1. WHEN the JioSaavn_API is unreachable or returns a 5xx error, THE Backend SHALL return a 502
   response with error code `EXTERNAL_API`, and THE Frontend SHALL display a non-blocking
   toast notification with a "Retry" button.
2. WHEN the Backend returns a 429 Too Many Requests response, THE Frontend SHALL retry the
   request using exponential backoff starting at 1 second, with a maximum of 3 retries.
3. WHEN a stream URL fails to load for a given Audio_Quality, THE Player SHALL attempt the
   next lower quality tier before surfacing an error (see Requirement 7.2).
4. WHEN a page or data fetch produces an error that cannot be recovered, THE Frontend SHALL
   display an empty-state component with a contextual suggestion (e.g., "Try searching for
   something else" on search pages).
5. THE Backend SHALL never return internal stack traces or `passwordHash` values in error
   responses to clients.
6. THE Backend SHALL log all errors with structured fields (`event`, `userId`, `statusCode`,
   `error.message`) using Pino before returning the error response.

---

### Requirement 20: API Security and Input Validation

**User Story:** As a system operator, I want all API endpoints to be secure and validated,
so that the application is protected against common web vulnerabilities.

#### Acceptance Criteria

1. THE Backend SHALL validate every incoming request body, URL parameter, and query string
   using a Zod schema before executing any business logic; requests failing validation SHALL
   receive a 400 response with error code `VALIDATION`.
2. THE Backend SHALL verify a valid Access_Token (JWT signature, expiry, and issuer claim)
   on every protected endpoint before processing the request.
3. THE Backend SHALL verify resource ownership (`resource.userId === authenticatedUserId`)
   in the Service layer before performing any mutation on user-owned resources.
4. THE Backend SHALL set the following HTTP security headers on all responses: `Content-Security-Policy`,
   `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security`
   (in production).
5. THE Backend SHALL limit request body size to 1 MB via Fastify's `bodyLimit` option.
6. THE Backend SHALL use parameterised queries exclusively via Drizzle ORM; string-concatenated
   SQL SHALL NOT be used anywhere in the codebase.
7. THE Backend SHALL store Refresh_Tokens as opaque hashed values in the Database; the raw
   token value SHALL NOT be stored.

---

### Requirement 21: CI/CD and Code Quality

**User Story:** As a developer, I want automated checks on every pull request, so that code
quality and correctness are consistently enforced.

#### Acceptance Criteria

1. THE System SHALL include a GitHub Actions CI workflow that runs on every pull request to
   `main`, executing TypeScript compilation (`tsc --noEmit`), ESLint, and all automated tests.
2. IF the CI workflow fails on any check, THEN THE System SHALL block the pull request from
   being merged until all checks pass.
3. THE Backend SHALL maintain 100% TypeScript strict mode compliance (`"strict": true` in
   `tsconfig.json`) with zero `any` types, zero `@ts-ignore` comments, and zero
   non-null assertions.
4. THE Frontend SHALL maintain 100% TypeScript strict mode compliance with the same
   constraints as Requirement 21.3.
5. THE System SHALL enforce a maximum cyclomatic complexity of 10 per function via ESLint.
