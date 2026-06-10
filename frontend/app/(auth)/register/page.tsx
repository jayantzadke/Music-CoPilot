'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Music, Check, X, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? <Check size={12} className="text-accent" /> : <X size={12} className="text-muted" />}
      <span className={met ? 'text-accent' : 'text-muted'}>{label}</span>
    </div>
  )
}

function validatePassword(p: string) {
  return {
    length:  p.length >= 8,
    upper:   /[A-Z]/.test(p),
    number:  /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuthStore()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPwd, setShowPwd]         = useState(false)
  const [showRules, setShowRules]     = useState(false)
  const [error, setError]             = useState('')

  const rules = validatePassword(password)
  const allRulesMet = Object.values(rules).every(Boolean)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!allRulesMet) {
      setError('password does not meet all requirements')
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
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Music className="text-accent" size={32} />
            <span className="text-2xl font-bold">Music-CoPilot</span>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Create your account</h1>
        <p className="text-center text-sm text-muted mb-8">Free forever. No card needed.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-semibold">What should we call you?</label>
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
              className="px-4 py-3 rounded-lg bg-elevated text-white border border-border focus:border-white outline-none text-sm transition-colors"
              placeholder="Your name"
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
                onFocus={() => setShowRules(true)}
                required
                className="w-full px-4 py-3 pr-12 rounded-lg bg-elevated text-white border border-border focus:border-white outline-none text-sm transition-colors"
                placeholder="Create a strong password"
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
            {showRules && (
              <div className="mt-2 p-3 rounded-lg bg-elevated-2 flex flex-col gap-1">
                <PasswordRule met={rules.length}  label="At least 8 characters" />
                <PasswordRule met={rules.upper}   label="One uppercase letter" />
                <PasswordRule met={rules.number}  label="One number" />
                <PasswordRule met={rules.special} label="One special character (!@#$...)" />
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !allRulesMet}
            className="w-full py-3 rounded-full bg-accent text-black font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-40 mt-2"
          >
            {isLoading ? 'Creating account...' : 'Get started'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:text-accent underline transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
