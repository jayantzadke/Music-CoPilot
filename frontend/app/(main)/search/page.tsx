'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search/${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="py-12 px-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-white">Search</h1>

      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search size={20} className="absolute left-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Songs, albums, artists..."
            autoFocus
            className="w-full pl-12 pr-4 py-4 bg-elevated rounded-xl text-white text-lg placeholder:text-muted outline-none focus:ring-2 focus:ring-accent transition-all"
            aria-label="Search"
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim()}
          className="mt-4 w-full py-3 rounded-xl bg-accent text-black font-semibold text-sm hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </form>

      <p className="text-muted text-sm mt-6 text-center">
        find songs, albums, and artists
      </p>
    </div>
  )
}
