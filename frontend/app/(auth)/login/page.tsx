'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Music, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const ACCESS_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE ?? 'MUSIC9098'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const [accessCode, setAccessCode] = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [error, setError]           = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (accessCode.trim().toUpperCase() !== ACCESS_CODE.toUpperCase()) {
      setError('invalid access code')
      return
    }

    try {
      await login(email, password)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'login failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Music className="text-accent" size={32} />
            <span className="text-2xl font-bold">Music-CoPilot</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Welcome back</h1>
        <p className="text-center text-sm text-muted mb-8">Log in to continue listening</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="accessCode" className="text-sm font-semibold">Access Code</label>
            <input
              id="accessCode"
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              required
              autoFocus
              className="px-4 py-3 rounded-lg bg-elevated text-white border border-border focus:border-accent outline-none text-sm transition-colors tracking-widest uppercase"
              placeholder="Enter access code"
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
              className="px-4 py-3 rounded-lg bg-elevated text-white border border-border focus:border-white outline-none text-sm transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-semibold">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-lg bg-elevated text-white border border-border focus:border-white outline-none text-sm transition-colors"
                placeholder="Your password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-accent text-black font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          New here?{' '}
          <Link href="/register" className="text-white hover:text-accent underline transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
