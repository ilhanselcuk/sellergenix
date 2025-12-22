/**
 * Amazon Connection Page
 * Connect and manage Amazon Seller Central integration
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'
import { AmazonConnectionClient } from '@/components/amazon/AmazonConnectionClient'
import { SearchHelp } from '@/components/dashboard/SearchHelp'

export default async function AmazonConnectionPage() {
  const supabase = await createClient()

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
                  className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-semibold transition-all"
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
                  className="px-4 py-2 text-white bg-slate-800 rounded-lg font-bold transition-all"
                >
                  Amazon
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Ask Genix Search */}
              <SearchHelp />

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

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AmazonConnectionClient userId={user.id} />
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-white py-12 mt-12">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold">
                  SG
                </div>
                <span className="text-xl font-black">SellerGenix</span>
              </div>
              <p className="text-slate-500 text-sm">
                AI-Powered Analytics for Amazon Excellence
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-slate-300">Product</h4>
              <div className="space-y-2 text-sm">
                <Link href="/features" className="block text-slate-500 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-slate-500 hover:text-white transition-colors">Pricing</Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-slate-300">Company</h4>
              <div className="space-y-2 text-sm">
                <Link href="/contact" className="block text-slate-500 hover:text-white transition-colors">Contact</Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-slate-300">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link href="/terms" className="block text-slate-500 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-slate-500 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/sales-agreement" className="block text-slate-500 hover:text-white transition-colors">Sales Agreement</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-600 text-sm">
            <p>&copy; {new Date().getFullYear()} SellerGenix. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
