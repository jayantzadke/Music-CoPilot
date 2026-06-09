'use client'

import { create } from 'zustand'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  accessToken: string | null
  isLoading: boolean

  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: false,

  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setLoading: (loading) => set({ isLoading: loading }),

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? 'login failed')
      }
      const { user, accessToken } = await res.json()
      set({ user, accessToken })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true })
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? 'registration failed')
      }
      const { user, accessToken } = await res.json()
      set({ user, accessToken })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    const { accessToken } = get()
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: 'include',
    })
    set({ user: null, accessToken: null })
  },

  refreshToken: async () => {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) {
      set({ user: null, accessToken: null })
      return
    }
    const { accessToken } = await res.json()
    set({ accessToken })
  },

  updateProfile: async (data) => {
    const { accessToken } = get()
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('profile update failed')
    const { user } = await res.json()
    set({ user })
  },
}))
