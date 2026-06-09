'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Music } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuthStore()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('password must be at least 8 characters')
      return
    }
    try {
      await register(email, password, displayName)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Music className="text-accent" size={32} />
            <span className="text-2xl font-bold">Music-Pilot</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-8">Sign up</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-semibold">What should we call you?</label>
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="px-4 py-3 rounded bg-[#2a2a2a] text-white border border-border focus:border-white outline-none text-sm"
              placeholder="Display name"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-semibold">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-3 rounded bg-[#2a2a2a] text-white border border-border focus:border-white outline-none text-sm"
              placeholder="Email address"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-semibold">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="px-4 py-3 rounded bg-[#2a2a2a] text-white border border-border focus:border-white outline-none text-sm"
              placeholder="Password (min 8 chars)"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-accent text-black font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:text-accent underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
