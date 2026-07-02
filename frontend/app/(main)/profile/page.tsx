'use client'

import { useRouter } from 'next/navigation'
import { Music, LogOut, Heart, Clock, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useLibraryStore } from '@/stores/libraryStore'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { likedSongs, recentlyPlayed } = useLibraryStore()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  if (!user) return null

  return (
    <div className="py-6 px-4 md:px-6 max-w-lg mx-auto">
      {/* avatar + name */}
      <div className="flex flex-col items-center gap-3 mb-8 pt-4">
        <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center">
          <span className="text-black text-3xl font-bold">
            {user.displayName?.[0]?.toUpperCase() ?? 'U'}
          </span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
          <p className="text-muted text-sm mt-1">{user.email}</p>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-elevated rounded-xl p-4 text-center">
          <Heart size={20} className="text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{likedSongs.length}</p>
          <p className="text-muted text-xs mt-1">Liked Songs</p>
        </div>
        <div className="bg-elevated rounded-xl p-4 text-center">
          <Clock size={20} className="text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{recentlyPlayed.length}</p>
          <p className="text-muted text-xs mt-1">Recently Played</p>
        </div>
      </div>

      {/* app info */}
      <div className="bg-elevated rounded-xl p-4 mb-4 flex items-center gap-3">
        <Music className="text-accent shrink-0" size={20} />
        <div>
          <p className="text-sm font-medium text-white">Music-CoPilot</p>
          <p className="text-xs text-muted">Your personal music streaming app</p>
        </div>
      </div>

      {/* logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium mt-4"
      >
        <LogOut size={18} />
        Log out
      </button>
    </div>
  )
}
