'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery('')
      return
    }
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading, error } = useSWR(
    debouncedQuery ? `/api/search/all?query=${encodeURIComponent(debouncedQuery)}` : null,
    fetcher,
    { dedupingInterval: 10_000, revalidateOnFocus: false },
  )

  return { results: data, isLoading, error, hasQuery: debouncedQuery.length > 0 }
}
