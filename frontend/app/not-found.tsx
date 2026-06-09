import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
      <h1 className="text-6xl font-black text-white">404</h1>
      <p className="text-muted text-lg">page not found</p>
      <Link
        href="/"
        className="mt-2 px-6 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors"
      >
        go home
      </Link>
    </div>
  )
}
