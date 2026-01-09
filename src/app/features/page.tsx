/**
 * Features Page - SellerGenix
 * Premium Dark Theme - Customer-Friendly Language Only
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Target,
  DollarSign,
  Bell,
  Globe,
  TrendingUp,
  Lock,
  CheckCircle,
  ArrowRight,
  Zap,
  Shield,
  Package,
  Clock,
  LineChart,
  PieChart,
  Map,
  Sparkles,
  LayoutGrid,
  RefreshCw,
  Menu,
  X
} from 'lucide-react'

export default function FeaturesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // LIVE FEATURES - Ready to use
  const liveFeatures = [
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500',
      description:
        'Powerful analytics dashboard with 7 different views to understand your Amazon business at a glance.',
      highlights: [
        { icon: LayoutGrid, text: 'Tiles View - Key metrics at a glance' },
        { icon: LineChart, text: 'Chart View - Visual trends & patterns' },
        { icon: PieChart, text: 'P&L View - Profit & Loss breakdown' },
        { icon: Map, text: 'Map View - Sales by US state' },
        { icon: TrendingUp, text: 'Trends View - Growth analysis' },
        { icon: LayoutGrid, text: 'Heatmap View - Performance calendar' },
        { icon: BarChart3, text: 'Comparison View - Period analysis' },
      ],
      gradient: 'from-purple-600 to-purple-700',
    },
    {
      icon: Package,
      title: 'Product & COGS Management',
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500',
      description:
        'Complete product cost tracking system for accurate profit calculations.',
      highlights: [
        { icon: DollarSign, text: 'Track Cost of Goods Sold (COGS)' },
        { icon: Package, text: 'Logistics & shipping costs' },
        { icon: Package, text: '3PL warehouse expenses' },
        { icon: DollarSign, text: 'Custom tax & duty costs' },
        { icon: TrendingUp, text: 'Automatic margin calculations' },
        { icon: BarChart3, text: 'Cost history & trends' },
      ],
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      icon: DollarSign,
      title: 'Profit Tracking',
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500',
      description:
        'Know your true profitability with detailed breakdowns and real-time calculations.',
      highlights: [
        { icon: DollarSign, text: 'Gross & net profit tracking' },
        { icon: TrendingUp, text: 'Profit margin percentage' },
        { icon: BarChart3, text: 'ROI calculations' },
        { icon: PieChart, text: 'Cost breakdown charts' },
        { icon: LineChart, text: 'Daily/weekly/monthly trends' },
        { icon: Package, text: 'Product-level profitability' },
      ],
      gradient: 'from-emerald-500 to-green-600',
    },
  ]

  // COMING SOON FEATURES
  const comingSoonFeatures = [
    {
      icon: Target,
      title: 'PPC Optimization',
      description: 'Automate your Amazon advertising for maximum ROI.',
      gradient: 'from-blue-600 to-blue-700',
    },
    {
      icon: Bell,
      title: 'WhatsApp Alerts',
      description: 'Get instant notifications on your phone.',
      gradient: 'from-green-600 to-green-700',
    },
    {
      icon: Globe,
      title: 'Multi-Marketplace',
      description: 'Manage US, UK, EU marketplaces together.',
      gradient: 'from-cyan-600 to-cyan-700',
    },
    {
      icon: Sparkles,
      title: 'AI Insights',
      description: 'Smart recommendations to grow your business.',
      gradient: 'from-pink-600 to-pink-700',
    },
    {
      icon: Package,
      title: 'Inventory Planning',
      description: 'Never run out of stock again.',
      gradient: 'from-violet-600 to-violet-700',
    },
    {
      icon: RefreshCw,
      title: 'Real-time Sync',
      description: 'Automatic data updates every 15 minutes.',
      gradient: 'from-teal-600 to-teal-700',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
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
              <Link href="/features" className="text-white font-semibold">
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
              <Link href="/auth/login" className="hidden sm:block text-slate-400 hover:text-white font-semibold transition-colors">
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="hidden sm:block px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                Start Free Trial
              </Link>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800"
          >
            <div className="px-4 py-4 space-y-4">
              <Link
                href="/features"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-white font-semibold"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-400 hover:text-white font-semibold transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-slate-400 hover:text-white font-semibold transition-colors"
              >
                Contact
              </Link>
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-slate-400 hover:text-white font-semibold transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-center"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8"
            >
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-400">Powerful Analytics for Amazon Sellers</span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-none tracking-tight mb-6">
              <span className="text-white">Everything You Need to</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Grow Your Business
              </span>
            </h1>

            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Comprehensive analytics, profit tracking, and cost management - all in one powerful platform built for Amazon sellers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Live Features Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Available Now</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Core Features
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Start using these powerful features today
            </p>
          </motion.div>

          <div className="space-y-24">
            {liveFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-dense' : ''
                }`}
              >
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-3xl font-black text-white">{feature.title}</h3>
                        <span className={`px-3 py-1 ${feature.badgeColor} rounded-full text-xs font-black text-white`}>
                          {feature.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {feature.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
                        <item.icon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        <span className="text-slate-300 font-medium text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <div className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-px`}>
                    <div className="bg-slate-900 rounded-2xl p-4">
                      <div className="w-full h-80 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
                        {/* Analytics Dashboard Preview */}
                        {index === 0 && (
                          <div className="p-4 h-full flex flex-col">
                            {/* Mini Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md" />
                                <span className="text-xs font-bold text-white">Dashboard</span>
                              </div>
                              <div className="flex gap-1">
                                <div className="w-12 h-5 bg-purple-500/20 rounded text-[8px] text-purple-400 flex items-center justify-center font-bold">Tiles</div>
                                <div className="w-12 h-5 bg-slate-700/50 rounded text-[8px] text-slate-400 flex items-center justify-center">Chart</div>
                                <div className="w-10 h-5 bg-slate-700/50 rounded text-[8px] text-slate-400 flex items-center justify-center">P&L</div>
                              </div>
                            </div>
                            {/* Mini Metric Cards */}
                            <div className="grid grid-cols-5 gap-2 mb-3">
                              {[
                                { period: 'Today', value: '$2,456', change: '+12.3%' },
                                { period: 'Yesterday', value: '$1,892', change: '+8.7%' },
                                { period: '7 Days', value: '$14,230', change: '+15.2%' },
                                { period: '30 Days', value: '$48,670', change: '+22.1%' },
                                { period: 'Month', value: '$52,340', change: '+18.9%' },
                              ].map((item, i) => (
                                <div key={i} className={`p-2 rounded-lg ${i === 0 ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-slate-800/50'}`}>
                                  <p className="text-[7px] text-slate-400 mb-1">{item.period}</p>
                                  <p className="text-xs font-bold text-emerald-400">{item.value}</p>
                                  <p className="text-[7px] text-emerald-400">{item.change}</p>
                                </div>
                              ))}
                            </div>
                            {/* Mini Chart */}
                            <div className="flex-1 bg-slate-800/30 rounded-lg p-3">
                              <div className="flex items-end justify-between h-full gap-1">
                                {[45, 62, 38, 71, 55, 48, 82, 65, 43, 78, 52, 69, 41, 85, 58, 73, 49, 91, 67, 76].map((height, i) => (
                                  <div
                                    key={i}
                                    className="flex-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t opacity-80"
                                    style={{ height: `${height}%` }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Product & COGS Management Preview */}
                        {index === 1 && (
                          <div className="p-4 h-full flex flex-col">
                            {/* Mini Header */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-white">Products</span>
                              <div className="px-2 py-1 bg-amber-500/20 rounded text-[8px] text-amber-400 font-bold">24 Products</div>
                            </div>
                            {/* Mini Product Table */}
                            <div className="flex-1 space-y-2 overflow-hidden">
                              {[
                                { name: 'Premium Yoga Mat', asin: 'B08XYZ123', cogs: '$18.50' },
                                { name: 'Wireless Earbuds', asin: 'B09ABC456', cogs: '$24.99' },
                                { name: 'Phone Stand', asin: 'B07DEF789', cogs: '$8.25' },
                                { name: 'LED Strip Lights', asin: 'B08GHI012', cogs: '$12.75' },
                              ].map((product, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500/30 to-orange-500/30 rounded-md flex items-center justify-center">
                                    <Package className="w-4 h-4 text-amber-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-bold text-white truncate">{product.name}</p>
                                    <p className="text-[7px] text-slate-400">ASIN: {product.asin}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[9px] font-bold text-emerald-400">{product.cogs}</p>
                                    <p className="text-[7px] text-slate-400">COGS</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Mini Cost Breakdown */}
                            <div className="mt-2 p-2 bg-slate-800/30 rounded-lg">
                              <div className="flex items-center justify-between text-[8px]">
                                <span className="text-slate-400">Total COGS Value:</span>
                                <span className="font-bold text-amber-400">$12,450</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Profit Tracking Preview */}
                        {index === 2 && (
                          <div className="p-4 h-full flex flex-col">
                            {/* Mini Header */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-white">Profit Analysis</span>
                              <div className="px-2 py-1 bg-emerald-500/20 rounded text-[8px] text-emerald-400 font-bold">Last 30 Days</div>
                            </div>
                            {/* Mini Profit Cards */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <p className="text-[7px] text-slate-400">Net Profit</p>
                                <p className="text-sm font-black text-emerald-400">$8,456</p>
                                <p className="text-[7px] text-emerald-400">↑ 23.5%</p>
                              </div>
                              <div className="p-2 bg-slate-800/50 rounded-lg">
                                <p className="text-[7px] text-slate-400">Gross Profit</p>
                                <p className="text-sm font-bold text-white">$12,890</p>
                                <p className="text-[7px] text-emerald-400">↑ 18.2%</p>
                              </div>
                              <div className="p-2 bg-slate-800/50 rounded-lg">
                                <p className="text-[7px] text-slate-400">Margin</p>
                                <p className="text-sm font-bold text-white">34.2%</p>
                                <p className="text-[7px] text-emerald-400">↑ 2.1%</p>
                              </div>
                            </div>
                            {/* Mini Breakdown */}
                            <div className="flex-1 bg-slate-800/30 rounded-lg p-3 space-y-2">
                              {[
                                { label: 'Revenue', value: '$24,500', color: 'bg-blue-500' },
                                { label: 'Amazon Fees', value: '-$4,230', color: 'bg-red-500' },
                                { label: 'Ad Spend', value: '-$2,890', color: 'bg-amber-500' },
                                { label: 'COGS', value: '-$8,924', color: 'bg-purple-500' },
                              ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className={`w-2 h-2 ${item.color} rounded-full`} />
                                  <span className="text-[8px] text-slate-400 flex-1">{item.label}</span>
                                  <span className={`text-[9px] font-bold ${item.value.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>{item.value}</span>
                                </div>
                              ))}
                            </div>
                            {/* ROI Badge */}
                            <div className="mt-2 flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg border border-emerald-500/30">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                              <span className="text-xs font-black text-emerald-400">ROI: 142%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Features */}
      <section className="relative z-10 py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Coming Soon</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              More Features on the Way
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              We&apos;re constantly adding new capabilities
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comingSoonFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute -top-3 -right-3 z-10">
                  <div className="px-3 py-1 bg-amber-500 rounded-full shadow-lg shadow-amber-500/25">
                    <span className="text-xs font-black text-slate-900">SOON</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-px hover:from-slate-700 hover:to-slate-800 transition-all duration-300 h-full">
                  <div className="bg-slate-900 rounded-2xl p-6 h-full opacity-70 group-hover:opacity-100 transition-opacity">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg opacity-60`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="relative z-10 py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-black text-white mb-4">Enterprise-Grade Security</h2>
            <p className="text-slate-400">Your data is protected with industry-leading security</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: 'Secure Authentication',
                description: 'Multi-factor authentication and encrypted sessions keep your account safe.',
              },
              {
                icon: Shield,
                title: 'Data Protection',
                description: 'All data is encrypted at rest and in transit using bank-level encryption.',
              },
              {
                icon: CheckCircle,
                title: 'Amazon Partner',
                description: 'Official Amazon Solution Provider with approved API access.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-px">
                  <div className="bg-slate-900 rounded-2xl p-6 text-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-emerald-600/20 rounded-3xl p-px">
              <div className="bg-slate-900 rounded-3xl px-8 py-16 sm:px-16">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                  Ready to Boost Your Profits?
                </h2>
                <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                  Start your 14-day free trial today. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/register"
                    className="px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl font-black text-lg text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="px-10 py-5 border-2 border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-2xl text-lg font-black transition-all duration-300"
                  >
                    Contact Sales
                  </Link>
                </div>
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
              <p className="text-slate-500 text-sm">
                AI-Powered Analytics for Amazon Excellence
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <div className="space-y-3 text-sm">
                <Link href="/features" className="block text-slate-500 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-slate-500 hover:text-white transition-colors">Pricing</Link>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <div className="space-y-3 text-sm">
                <Link href="/contact" className="block text-slate-500 hover:text-white transition-colors">Contact</Link>
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

          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} SellerGenix. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
