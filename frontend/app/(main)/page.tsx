'use client'

import { useState, useEffect } from 'react'
import { HomeSection } from '@/components/home/HomeSection'

const LANGUAGES = ['hindi', 'english', 'tamil', 'telugu', 'punjabi'] as const

interface Module {
  title: string
  type: string
  data: unknown[]
}

export default function HomePage() {
  const [lang, setLang] = useState('hindi')
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setError(false)

    fetch(`/api/music/modules?languages=${lang}`)
      .then((r) => r.json())
      .then((data) => {
        const sections = extractSections(data)
        setModules(sections)
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [lang])

  return (
    <div className="py-6">
      {/* language filter */}
      <div className="flex gap-2 px-6 mb-6 flex-wrap">
        {LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              lang === l
                ? 'bg-white text-black'
                : 'bg-surface-hover text-muted hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-6">
          <p className="text-muted text-sm">couldn&apos;t load content right now — try again in a moment</p>
        </div>
      )}

      {modules.map((section, i) => (
        <HomeSection
          key={`${section.title}-${i}`}
          title={section.title}
          type={section.type as ContentType}
          items={section.data as never[]}
          isLoading={isLoading}
        />
      ))}

      {isLoading && !error && (
        // skeleton placeholders while loading
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <HomeSection
              key={i}
              title=""
              type="song"
              items={[]}
              isLoading
            />
          ))}
        </div>
      )}
    </div>
  )
}

// maps backend response to displayable sections
function extractSections(data: unknown): Module[] {
  if (!data || typeof data !== 'object') return []
  const d = data as Record<string, unknown>

  const sections: Module[] = []

  const sectionMap: Array<{ key: string; title: string; type: string; subKey?: string }> = [
    { key: 'trending', title: 'Trending Songs', type: 'song', subKey: 'songs' },
    { key: 'newReleases', title: 'New Releases', type: 'album', subKey: 'albums' },
    { key: 'topArtists', title: 'Top Artists', type: 'artist', subKey: 'artists' },
  ]

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
