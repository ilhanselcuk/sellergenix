/**
 * Landing Page - SellerGenix
 * Premium Dark Theme - World-Class SaaS Design
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Star,
  Shield,
  Clock,
  Globe,
  Users,
  DollarSign,
  LineChart,
  PieChart,
  Activity,
  Bell,
  Sparkles,
  Play,
  ChevronRight
} from 'lucide-react'
import { AuthModal } from '@/components/modals/AuthModal'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-[128px]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
                <span className="text-xl font-black text-white">SG</span>
              </div>
              <span className="text-xl font-black text-white">SellerGenix</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-slate-400 hover:text-white font-semibold transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-slate-400 hover:text-white font-semibold transition-colors">
                Pricing
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-white font-semibold transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                      >
                        Dashboard
                      </Link>
                      <form action="/auth/logout" method="post">
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm border border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-all duration-300"
                        >
                          Sign Out
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openAuthModal('login')}
                        className="text-slate-400 hover:text-white font-semibold transition-colors"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => openAuthModal('register')}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
                      >
                        Start Free Trial
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-400">AI-Powered Analytics Platform</span>
              <ChevronRight className="w-4 h-4 text-purple-400" />
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight mb-6">
              <span className="text-white">Transform Your</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Amazon Business
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl sm:text-2xl text-slate-400 leading-relaxed font-medium max-w-3xl mx-auto mb-12">
              Smart analytics, automated insights, and real-time data to maximize your profits and scale your Amazon sales
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {user ? (
                <Link
                  href="/dashboard"
                  className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-black text-lg text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-black text-lg text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>

                  <Link
                    href="/contact"
                    className="group px-10 py-5 border-2 border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-2xl text-lg font-black transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </Link>
                </>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
              {[
                { icon: CheckCircle, text: '14-Day Free Trial' },
                { icon: Shield, text: 'No Credit Card Required' },
                { icon: Clock, text: 'Cancel Anytime' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-500">
                  <item.icon className="w-5 h-5 text-emerald-500" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Dashboard Preview - Real UI Based on Actual Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-emerald-600/30 rounded-3xl p-px shadow-2xl shadow-purple-500/20">
              <div className="bg-slate-900 rounded-3xl p-2 sm:p-4">
                <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
                  {/* Browser Header */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/80 border-b border-slate-700">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-slate-800 rounded-lg px-4 py-1.5 text-sm text-slate-500 max-w-md mx-auto flex items-center justify-center gap-2">
                        <Shield className="w-3 h-3 text-emerald-400" />
                        app.sellergenix.io/dashboard
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Content - Real UI */}
                  <div className="p-4 sm:p-6 bg-slate-900">
                    {/* Header with Ask Genix */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white">Analytics Dashboard</h3>
                        <p className="text-xs text-slate-500">Welcome back, ILHAN SELCUK. Click on chart bars to see daily breakdown.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-lg flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span className="text-xs font-bold text-amber-400">Ask Genix</span>
                        </div>
                        <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                          <span className="text-xs text-slate-400">Today / Yesterday</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Row - Business Health, Critical Alerts, AI Insights, Cash Flow */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                      {/* Business Health */}
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Business Health</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-white">81</span>
                          <span className="text-lg text-emerald-400">/100</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                          <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 rounded-full" style={{ width: '81%' }} />
                        </div>
                        <p className="text-[10px] text-emerald-400 mt-2">+6 pts this week</p>
                      </div>

                      {/* Critical Alerts */}
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Critical Alerts</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">3</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-amber-400">⚠</span>
                            <span className="text-slate-300">Yoga Mat stock low</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-blue-400">📊</span>
                            <span className="text-slate-300">ACOS increased 38%</span>
                          </div>
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">AI Insights</span>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">New</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-emerald-400">💰</span>
                            <span className="text-slate-300">$2.3K/mo savings opportunity</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-blue-400">📈</span>
                            <span className="text-slate-300">Yoga category +45%</span>
                          </div>
                        </div>
                      </div>

                      {/* Cash Flow */}
                      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Cash Flow</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-1">Next Payout (Dec 26)</p>
                        <span className="text-2xl font-black text-emerald-400">$9.9K</span>
                        <div className="flex items-center justify-between mt-2 text-[10px]">
                          <span className="text-slate-500">Reserve</span>
                          <span className="text-red-400">$2.6K</span>
                        </div>
                      </div>
                    </div>

                    {/* IPI Score Section */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Inventory Performance Index (IPI)</h4>
                            <p className="text-[10px] text-slate-500">FBA Inventory Efficiency Score</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">Healthy</span>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                        {/* Gauge */}
                        <div className="col-span-2 lg:col-span-1 flex flex-col items-center">
                          <div className="relative w-24 h-12 mb-1">
                            <svg viewBox="0 0 100 50" className="w-full h-full">
                              <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                              <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="url(#gaugeGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray="126" strokeDashoffset="47" />
                              <defs>
                                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#ef4444" />
                                  <stop offset="50%" stopColor="#eab308" />
                                  <stop offset="100%" stopColor="#22c55e" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-black text-emerald-400">628</span>
                            <span className="text-xs text-slate-500"> / 1000</span>
                          </div>
                        </div>
                        {/* IPI Metrics */}
                        {[
                          { label: 'Excess Inventory', value: '11%', subtext: '$2.5K value', color: 'text-cyan-400' },
                          { label: 'Stranded', value: '2', subtext: '$405 value', color: 'text-red-400' },
                          { label: 'In-Stock Rate', value: '95%', subtext: '+3% vs last month', color: 'text-emerald-400' },
                          { label: 'Sell-Through', value: '2.9', subtext: 'weeks inventory', color: 'text-blue-400' },
                        ].map((item, i) => (
                          <div key={i} className="bg-slate-700/30 rounded-lg p-3">
                            <p className="text-[10px] text-slate-400 uppercase mb-1">{item.label}</p>
                            <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                            <p className="text-[10px] text-slate-500">{item.subtext}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Product Breakdown Table */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-3 h-3 text-white" />
                          </div>
                          <h4 className="text-sm font-bold text-white">Product Breakdown</h4>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-slate-700 rounded text-[10px] text-slate-400">Search ASIN...</div>
                          <div className="px-2 py-1 bg-blue-600 rounded text-[10px] text-white font-bold">Export</div>
                        </div>
                      </div>
                      {/* Summary Row */}
                      <div className="grid grid-cols-6 gap-2 mb-3 pb-3 border-b border-slate-700">
                        {[
                          { label: 'Revenue', value: '$1.0K', color: 'text-white' },
                          { label: 'Net Profit', value: '$587', color: 'text-emerald-400' },
                          { label: 'Stock', value: '393', color: 'text-cyan-400' },
                          { label: 'Units', value: '24', color: 'text-white' },
                          { label: 'Ad Spend', value: '-$81', color: 'text-red-400' },
                          { label: 'Margin', value: '58.6%', color: 'text-emerald-400' },
                        ].map((item, i) => (
                          <div key={i}>
                            <p className="text-[9px] text-slate-500 uppercase">{item.label}</p>
                            <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="text-slate-500 uppercase">
                              <th className="text-left py-2">Product</th>
                              <th className="text-right">Stock</th>
                              <th className="text-right">Units</th>
                              <th className="text-right">Sales</th>
                              <th className="text-right">Ads</th>
                              <th className="text-right">Net</th>
                              <th className="text-right">Margin</th>
                              <th className="text-right">ROI</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-300">
                            {[
                              { name: 'Resistance Bands Set', img: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=40&h=40&fit=crop', stock: 55, units: 4, sales: '$280', ads: '-$22', net: '$175', margin: '62.50%', roi: '426.8%' },
                              { name: 'Wireless Bluetooth Earbuds', img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=40&h=40&fit=crop', stock: 5, units: 5, sales: '$162', ads: '-$13', net: '$87', margin: '53.70%', roi: '235.1%', lowStock: true },
                              { name: 'Premium Cork Yoga Mat', img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=40&h=40&fit=crop', stock: 32, units: 3, sales: '$100', ads: '-$8', net: '$57', margin: '57.00%', roi: '285.0%' },
                            ].map((product, i) => (
                              <tr key={i} className="border-t border-slate-700/50">
                                <td className="py-2 flex items-center gap-2">
                                  <img
                                    src={product.img}
                                    alt={product.name}
                                    className="w-7 h-7 rounded-md object-cover border border-slate-600"
                                  />
                                  <span className="font-medium">{product.name}</span>
                                  {product.lowStock && <span className="w-2 h-2 rounded-full bg-red-500" />}
                                </td>
                                <td className={`text-right ${product.lowStock ? 'text-red-400' : ''}`}>{product.stock}</td>
                                <td className="text-right">{product.units}</td>
                                <td className="text-right font-medium">{product.sales}</td>
                                <td className="text-right text-red-400">{product.ads}</td>
                                <td className="text-right text-emerald-400 font-bold">{product.net}</td>
                                <td className="text-right text-emerald-400">{product.margin}</td>
                                <td className="text-right">{product.roi}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: 'Active Sellers', icon: Users },
              { value: '$2.5B+', label: 'GMV Tracked', icon: DollarSign },
              { value: '24/7', label: 'Real-Time Sync', icon: Clock },
              { value: '99.9%', label: 'Uptime SLA', icon: Shield },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl flex items-center justify-center border border-slate-700">
                  <stat.icon className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-slate-500 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Grow Your Business
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Comprehensive analytics, profit tracking, and cost management for Amazon sellers
            </p>
          </motion.div>

          {/* LIVE Features */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-wide">Available Now</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: LineChart,
                  title: 'Analytics Dashboard',
                  description: '7 powerful views including Tiles, Charts, P&L, Map, Trends, Heatmap, and Comparison.',
                  gradient: 'from-purple-600 to-purple-700'
                },
                {
                  icon: DollarSign,
                  title: 'Profit Tracking',
                  description: 'Know your true profitability with accurate calculations including all costs and fees.',
                  gradient: 'from-emerald-600 to-emerald-700'
                },
                {
                  icon: BarChart3,
                  title: 'COGS Management',
                  description: 'Track product costs, logistics, 3PL expenses, and custom taxes for accurate margins.',
                  gradient: 'from-amber-600 to-amber-700'
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                  <div className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-px hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300`}>
                    <div className="bg-slate-900 rounded-2xl p-6 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <feature.icon className="w-7 h-7 text-white" />
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500 rounded-full text-xs font-black text-white">
                          LIVE
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-400">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Coming Soon Features */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-amber-400 uppercase tracking-wide">Coming Soon</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Target,
                  title: 'PPC Optimization',
                  description: 'Automate your Amazon advertising for maximum ROI.',
                  gradient: 'from-blue-600 to-blue-700'
                },
                {
                  icon: Bell,
                  title: 'WhatsApp Alerts',
                  description: 'Get instant notifications on your phone.',
                  gradient: 'from-green-600 to-green-700'
                },
                {
                  icon: Activity,
                  title: 'Inventory Planning',
                  description: 'Never run out of stock again.',
                  gradient: 'from-cyan-600 to-cyan-700'
                },
                {
                  icon: Globe,
                  title: 'Multi-Marketplace',
                  description: 'Manage US, UK, EU marketplaces together.',
                  gradient: 'from-pink-600 to-pink-700'
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative"
                >
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="px-2 py-0.5 bg-amber-500 rounded-full text-[10px] font-black text-slate-900">
                      SOON
                    </span>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-px hover:from-slate-700 hover:to-slate-800 transition-all duration-300 h-full">
                    <div className="bg-slate-900 rounded-2xl p-5 h-full opacity-70 group-hover:opacity-100 transition-opacity">
                      <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-3 shadow-lg opacity-60`}>
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                      <p className="text-slate-500 text-sm">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* View All Features Link */}
          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-bold transition-colors"
            >
              View All Features
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="relative z-10 py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Trusted by Top Sellers
            </h2>
            <p className="text-xl text-slate-400">
              Join thousands of successful Amazon sellers already using SellerGenix
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "SellerGenix helped us increase our profit margins by 23% in just 3 months. The real-time analytics are game-changing.",
                author: "Sarah M.",
                role: "7-Figure Amazon Seller",
                avatar: "SM"
              },
              {
                quote: "The PPC optimization alone saved us $4,000/month in wasted ad spend. Best investment we've made for our business.",
                author: "Michael R.",
                role: "Private Label Brand Owner",
                avatar: "MR"
              },
              {
                quote: "Finally, a tool that shows true profit after ALL fees. No more spreadsheet nightmares. Highly recommended!",
                author: "Jennifer L.",
                role: "Multi-Brand Seller",
                avatar: "JL"
              },
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-2xl p-px">
                  <div className="bg-slate-900 rounded-2xl p-6 h-full">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-white">{testimonial.author}</p>
                        <p className="text-sm text-slate-500">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-emerald-600/20 rounded-3xl p-px">
              <div className="bg-slate-900 rounded-3xl px-8 py-16 sm:px-16">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                  Ready to Scale Your
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                    Amazon Business?
                  </span>
                </h2>
                <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                  Join 10,000+ sellers who trust SellerGenix to grow their business. Start your free trial today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {user ? (
                    <Link
                      href="/dashboard"
                      className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-black text-lg text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => openAuthModal('register')}
                        className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-black text-lg text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Start Free Trial
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      <Link
                        href="/pricing"
                        className="px-10 py-5 border-2 border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-2xl text-lg font-black transition-all duration-300"
                      >
                        View Pricing
                      </Link>
                    </>
                  )}
                </div>
                <p className="mt-6 text-sm text-slate-500">
                  No credit card required • 14-day free trial • Cancel anytime
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 border-t border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center font-bold text-white">
                  SG
                </div>
                <span className="text-xl font-black text-white">SellerGenix</span>
              </div>
              <p className="text-slate-500 text-sm mb-4">
                AI-Powered Analytics for Amazon Excellence. Transform your business with real-time insights.
              </p>
              <div className="flex gap-3">
                {['Twitter', 'LinkedIn', 'YouTube'].map((social, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    {social[0]}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <div className="space-y-3 text-sm">
                <Link href="/features" className="block text-slate-500 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-slate-500 hover:text-white transition-colors">Pricing</Link>
                <Link href="#" className="block text-slate-500 hover:text-white transition-colors">Integrations</Link>
                <Link href="#" className="block text-slate-500 hover:text-white transition-colors">API</Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <div className="space-y-3 text-sm">
                <Link href="/contact" className="block text-slate-500 hover:text-white transition-colors">Contact</Link>
                <Link href="#" className="block text-slate-500 hover:text-white transition-colors">About</Link>
                <Link href="#" className="block text-slate-500 hover:text-white transition-colors">Blog</Link>
                <Link href="#" className="block text-slate-500 hover:text-white transition-colors">Careers</Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <div className="space-y-3 text-sm">
                <Link href="/terms" className="block text-slate-500 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-slate-500 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/sales-agreement" className="block text-slate-500 hover:text-white transition-colors">Sales Agreement</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} SellerGenix. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span>Made with ♥ for Amazon Sellers</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {!user && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          mode={authMode}
          onSwitchMode={setAuthMode}
        />
      )}
    </div>
  )
}
