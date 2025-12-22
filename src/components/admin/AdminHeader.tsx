/**
 * Admin Header Component
 * Top bar with search, notifications, and user menu
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Moon,
  Sun,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin' | 'support' | 'viewer'
}

interface AdminHeaderProps {
  admin: AdminUser
}

export function AdminHeader({ admin }: AdminHeaderProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
    setIsLoggingOut(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers, transactions..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>
      </form>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Quick Actions */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm font-medium">View Site</span>
        </a>

        {/* Refresh */}
        <button
          onClick={() => router.refresh()}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          title="Refresh data"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-xl transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {admin.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-white">{admin.full_name}</p>
              <p className="text-xs text-slate-500">{admin.role.replace('_', ' ')}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />

                {/* Menu */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  {/* User Info */}
                  <div className="p-4 border-b border-slate-700">
                    <p className="text-sm font-bold text-white">{admin.full_name}</p>
                    <p className="text-xs text-slate-400">{admin.email}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                      {admin.role.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/admin/profile')
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        router.push('/admin/settings')
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Settings</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="p-2 border-t border-slate-700">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
