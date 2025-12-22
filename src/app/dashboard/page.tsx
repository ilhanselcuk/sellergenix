/**
 * Dashboard Page - SellerGenix
 * Executive Dark Theme Analytics Dashboard
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const profile = await getUserProfile(user.id)

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                  <span className="text-xl font-black text-white">SG</span>
                </div>
                <span className="text-xl font-black text-white">SellerGenix</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-white bg-slate-800 rounded-lg font-bold transition-all"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/products"
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-semibold transition-all"
                >
                  Products
                </Link>
                <Link
                  href="/dashboard/ppc"
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-semibold transition-all"
                >
                  PPC
                </Link>
                <Link
                  href="/dashboard/inventory"
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-semibold transition-all"
                >
                  Inventory
                </Link>
                <Link
                  href="/dashboard/amazon"
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-semibold transition-all"
                >
                  Amazon
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-white">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                className="px-4 py-2 text-sm border border-purple-500/50 text-purple-400 hover:border-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-xl font-bold transition-all duration-300"
              >
                Settings
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm border border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-all duration-300"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <ExecutiveDashboard
        profileName={profile?.full_name || 'User'}
        email={user.email || ''}
      />

      {/* Footer - Dark Theme */}
      <footer className="bg-slate-800 border-t border-slate-700 py-8">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">SG</span>
              </div>
              <span className="text-sm font-medium text-slate-400">SellerGenix</span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms</Link>
              <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">Contact</Link>
            </div>

            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} SellerGenix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
