/**
 * Dashboard Page - SellerGenix
 * Clean Light Theme Analytics Dashboard
 * Features: Period Cards, Product Table, AI Chat, COGS Management
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile, getActiveAmazonConnection, getDashboardData } from '@/lib/supabase/queries'
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

  // Get dashboard data from database
  const dashboardData = await getDashboardData(user.id)

  // Starbucks Color Palette
  const STARBUCKS = {
    primaryGreen: '#00704A',
    darkGreen: '#1E3932',
    lightGreen: '#D4E9E2',
    gold: '#CBA258',
    cream: '#F2F0EB',
    white: '#FFFFFF',
  }

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${STARBUCKS.cream} 0%, ${STARBUCKS.white} 50%, ${STARBUCKS.lightGreen}40 100%)` }}>
      {/* Premium Header - Starbucks Theme */}
      <div
        className="backdrop-blur-xl sticky top-0 z-50"
        style={{
          backgroundColor: `${STARBUCKS.white}E6`,
          borderBottom: `1px solid ${STARBUCKS.lightGreen}`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3 group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`,
                    boxShadow: `0 10px 25px -5px ${STARBUCKS.darkGreen}40`
                  }}
                >
                  <span className="text-lg font-bold text-white tracking-tight">SG</span>
                </div>
                <span className="text-xl font-bold tracking-tight" style={{ color: STARBUCKS.darkGreen }}>SellerGenix</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`,
                  }}
                >
                  Dashboard
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold" style={{ color: STARBUCKS.darkGreen }}>{profile?.full_name || 'User'}</p>
                <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>{user.email}</p>
              </div>
              <Link
                href="/dashboard/settings"
                className="px-4 py-2 text-sm rounded-xl font-medium transition-all hover:opacity-80"
                style={{
                  border: `1px solid ${STARBUCKS.lightGreen}`,
                  color: STARBUCKS.primaryGreen,
                  backgroundColor: STARBUCKS.white
                }}
              >
                Settings
              </Link>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm border border-rose-200 text-rose-600 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 rounded-xl font-medium transition-all"
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
        userId={user.id}
        profileName={profile?.full_name || 'User'}
        email={user.email || ''}
        hasAmazonConnection={hasAmazonConnection}
        dashboardData={dashboardData}
        lastSyncAt={amazonConnection?.last_synced_at || (amazonConnection as any)?.last_sync_at || null}
      />

      {/* Premium Footer - Starbucks Theme */}
      <footer
        className="backdrop-blur-sm py-8 mt-8"
        style={{
          backgroundColor: `${STARBUCKS.cream}80`,
          borderTop: `1px solid ${STARBUCKS.lightGreen}`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
                }}
              >
                <span className="text-xs font-bold text-white">SG</span>
              </div>
              <span className="text-sm font-medium" style={{ color: STARBUCKS.primaryGreen }}>SellerGenix</span>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/terms"
                className="transition-colors hover:opacity-80"
                style={{ color: STARBUCKS.primaryGreen }}
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="transition-colors hover:opacity-80"
                style={{ color: STARBUCKS.primaryGreen }}
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:opacity-80"
                style={{ color: STARBUCKS.primaryGreen }}
              >
                Contact
              </Link>
            </div>

            <p className="text-sm" style={{ color: STARBUCKS.primaryGreen }}>
              &copy; {new Date().getFullYear()} SellerGenix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
