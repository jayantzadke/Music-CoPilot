'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <p className="text-muted text-lg">something went wrong</p>
      <p className="text-sm text-subtle">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors"
      >
        try again
      </button>
    </div>
  )
}
