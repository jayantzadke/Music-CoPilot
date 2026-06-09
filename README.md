# Music CoPilot

A music streaming web app built around the JioSaavn catalogue. Search for songs, browse albums and artists, filter content by language, and play tracks directly in the browser — all without needing an account.

The idea was to build something that feels close to Spotify but focused on Indian music. Clean dark UI, instant search, a persistent player bar at the bottom, and a backend that acts as a smart proxy so the frontend never talks to any third-party API directly.

---

## What it does

Browse the home page to see trending songs and new releases filtered by language. Hindi, English, Tamil, Telugu, and Punjabi are all supported. Switch between them with one click and the content updates immediately.

Search works across songs, albums, and artists. Type something and you get suggestions as you go. Hit enter or pick a result and you land on a dedicated page with the full details.

The player sits at the bottom of the screen and stays there. Play a song, skip forward and back, shuffle, repeat, adjust volume — all the basics you expect. The audio quality defaults to 320kbps and falls back through lower tiers automatically if a stream fails.

Album pages show the full tracklist with artwork and metadata. Artist pages show their top songs and discography. Everything navigates cleanly without full page reloads.

---

## Tech stack

The backend is a Fastify server running on Node.js with TypeScript. It proxies all music data through a single service class so swapping the underlying music API tomorrow is just a one-line env change. Responses are cached in Redis when available, but the server runs fine without it too.

The frontend is Next.js 14 using the App Router. State lives in Zustand stores. Audio playback is handled by Howler.js. The UI is built with Tailwind CSS and shadcn components, dark theme throughout.

---

## Running locally

You need Node.js 20 and npm installed. Clone the repo and install dependencies in both folders.

```
cd backend
npm install
npm run dev
```

```
cd frontend
npm install
npm run dev
```

Backend starts on port 3002, frontend on port 3000. Open localhost:3000 in your browser.

The only required env var for the backend is MUSIC_API_URL which already has a default. Everything else is optional for local development. Copy backend/.env.example to backend/.env if you want to customise anything.

---

## Project structure

The backend follows a layered architecture. Routes call controllers, controllers call services, services handle all external API communication. There's a custom error hierarchy so every error maps to the right HTTP status code cleanly.

The frontend separates concerns into stores for state, hooks for logic, and components for rendering. The audio engine lives in a single hook that gets mounted once at the app root and drives the player store.

---

## Notes

This is an MVP. Auth, playlists, liked songs, and play history are designed and specced out but not built yet. The foundation is there to add them without touching anything that already works.

The music API key is configurable via environment variable. If you want to point it at a different compatible API, change MUSIC_API_URL in the backend env and nothing else needs to change.
