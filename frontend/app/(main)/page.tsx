'use client'

import { useState, useEffect } from 'react'
import { HomeSection } from '@/components/home/HomeSection'
import { useAuthStore } from '@/stores/authStore'
import type { ContentType } from '@/types'

const LANGUAGES = ['hindi', 'english', 'tamil', 'telugu', 'punjabi'] as const

interface Module {
  title: string
  type: string
  data: unknown[]
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const [lang, setLang]       = useState('hindi')
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]     = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    setIsLoading(true)
    setError(false)

    fetch(`/api/music/modules?languages=${lang}`)
      .then((r) => r.json())
      .then((data) => setModules(extractSections(data)))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [lang])

  return (
    <div className="py-6">
      {/* welcome header */}
      <div className="px-4 md:px-6 mb-6">
        {user ? (
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              {getGreeting()}, {user.displayName} 👋
            </h1>
            <p className="text-muted text-sm mt-1">what are we listening to today?</p>
          </div>
        ) : (
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{getGreeting()}</h1>
            <p className="text-muted text-sm mt-1">discover music you love</p>
          </div>
        )}
      </div>

      {/* language filter */}
      <div className="flex gap-2 px-4 md:px-6 mb-6 overflow-x-auto scrollbar-none flex-nowrap md:flex-wrap">
        {LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 md:px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize shrink-0 ${
              lang === l
                ? 'bg-white text-black'
                : 'bg-elevated text-muted hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-6 py-4">
          <p className="text-muted text-sm">couldn&apos;t load content right now — try again in a moment</p>
        </div>
      )}

      {isLoading && !error ? (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <HomeSection key={i} title="" type="song" items={[]} isLoading />
          ))}
        </div>
      ) : (
        modules.map((section, i) => (
          <HomeSection
            key={`${section.title}-${i}`}
            title={section.title}
            type={section.type as ContentType}
            items={section.data as never[]}
            isLoading={false}
          />
        ))
      )}
    </div>
  )
}

function extractSections(data: unknown): Module[] {
  if (!data || typeof data !== 'object') return []
  const d = data as Record<string, unknown>

  const sectionMap: Array<{ key: string; title: string; type: string; subKey?: string }> = [
    { key: 'trending',    title: 'Trending Songs', type: 'song',   subKey: 'songs'   },
    { key: 'newReleases', title: 'New Releases',   type: 'album',  subKey: 'albums'  },
    { key: 'topArtists',  title: 'Top Artists',    type: 'artist', subKey: 'artists' },
  ]

  const sections: Module[] = []
  for (const { key, title, type, subKey } of sectionMap) {
    const section = d[key] as Record<string, unknown> | undefined
    if (!section) continue
    const items = subKey ? (section[subKey] as unknown[]) : (section as unknown as unknown[])
    if (Array.isArray(items) && items.length > 0) {
      sections.push({ title, type, data: items })
    }
  }
  return sections
}
