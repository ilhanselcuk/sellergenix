/**
 * Dashboard Page - SellerGenix
 * Clean Light Theme Analytics Dashboard
 * Features: Period Cards, Product Table, AI Chat, COGS Management
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile, getActiveAmazonConnection } from '@/lib/supabase/queries'
import NewDashboardClient from '@/components/dashboard/NewDashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile and Amazon connection
  const profile = await getUserProfile(user.id)
  const amazonConnection = await getActiveAmazonConnection(user.id)
  const hasAmazonConnection = !!amazonConnection

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <span className="text-xl font-black text-white">SG</span>
                </div>
                <span className="text-xl font-black text-gray-900">SellerGenix</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-white bg-gray-900 rounded-lg font-bold transition-all"
                >
                  Dashboard
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-gray-900">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 rounded-xl font-medium transition-all"
              >
                Settings
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <NewDashboardClient
        profileName={profile?.full_name || 'User'}
        email={user.email || ''}
        hasAmazonConnection={hasAmazonConnection}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-white">SG</span>
              </div>
              <span className="text-sm font-medium text-gray-600">SellerGenix</span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link href="/terms" className="text-gray-500 hover:text-gray-900 transition-colors">Terms</Link>
              <Link href="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="/contact" className="text-gray-500 hover:text-gray-900 transition-colors">Contact</Link>
            </div>

            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} SellerGenix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
