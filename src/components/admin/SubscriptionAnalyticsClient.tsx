/**
 * Subscription Analytics Client Component
 * Revenue metrics, MRR/ARR tracking, churn analysis
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  PieChart,
  BarChart3,
  Activity
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  can_view_revenue: boolean
}

interface Stats {
  total: number
  byTier: {
    starter: number
    professional: number
    enterprise: number
  }
  byStatus: {
    active: number
    trial: number
    cancelled: number
    past_due: number
  }
  trialExpiringSoon: number
  newThisMonth: number
  churnedThisMonth: number
}

interface Profile {
  id: string
  email: string
  full_name: string | null
  subscription_tier: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
}

interface RevenueMonth {
  month: string
  mrr: number
  newMrr: number
  churnedMrr: number
  expansionMrr: number
}

interface SubscriptionAnalyticsClientProps {
  admin: AdminUser
  stats: Stats
  profiles: Profile[]
  revenueByMonth: RevenueMonth[]
  mrr: number
  arr: number
  tierPricing: { starter: number; professional: number; enterprise: number }
}

export function SubscriptionAnalyticsClient({
  admin,
  stats,
  profiles,
  revenueByMonth,
  mrr,
  arr,
  tierPricing
}: SubscriptionAnalyticsClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Calculate growth rate
  const lastMonth = revenueByMonth[revenueByMonth.length - 1]
  const prevMonth = revenueByMonth[revenueByMonth.length - 2]
  const mrrGrowth = prevMonth ? ((lastMonth?.mrr - prevMonth?.mrr) / prevMonth?.mrr * 100) : 0

  // Calculate churn rate
  const churnRate = stats.total > 0 ? (stats.churnedThisMonth / stats.total * 100) : 0

  // Calculate ARPU
  const arpu = stats.total > 0 ? mrr / stats.total : 0

  // KPI Cards
  const kpiCards = [
    {
      title: 'Monthly Recurring Revenue',
      value: formatCurrency(mrr),
      change: mrrGrowth,
      changeLabel: 'vs last month',
      icon: DollarSign,
      gradient: 'from-emerald-600 to-green-600'
    },
    {
      title: 'Annual Recurring Revenue',
      value: formatCurrency(arr),
      change: mrrGrowth,
      changeLabel: 'projected',
      icon: TrendingUp,
      gradient: 'from-blue-600 to-cyan-600'
    },
    {
      title: 'Average Revenue Per User',
      value: formatCurrency(arpu),
      change: 0,
      changeLabel: 'per month',
      icon: Users,
      gradient: 'from-purple-600 to-violet-600'
    },
    {
      title: 'Churn Rate',
      value: `${churnRate.toFixed(1)}%`,
      change: -0.5,
      changeLabel: 'vs last month',
      icon: AlertTriangle,
      gradient: 'from-amber-600 to-orange-600',
      invertColor: true
    }
  ]

  // Tier distribution for chart
  const tierDistribution = [
    { name: 'Starter', value: stats.byTier.starter, color: '#6b7280', price: tierPricing.starter },
    { name: 'Professional', value: stats.byTier.professional, color: '#8b5cf6', price: tierPricing.professional },
    { name: 'Enterprise', value: stats.byTier.enterprise, color: '#f59e0b', price: tierPricing.enterprise }
  ]

  const totalRevenue = tierDistribution.reduce((sum, tier) => sum + (tier.value * tier.price), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Subscription Analytics</h1>
          <p className="text-slate-400 mt-1">Revenue metrics and subscription insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1">
            {(['monthly', 'quarterly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedPeriod === period
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold text-sm transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-px`}>
              <div className="bg-slate-900 rounded-2xl p-5 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-1">{card.title}</p>
                <p className="text-3xl font-black text-white mb-2">{card.value}</p>
                <div className="flex items-center gap-1">
                  {card.change > 0 ? (
                    <ArrowUpRight className={`w-4 h-4 ${card.invertColor ? 'text-red-400' : 'text-emerald-400'}`} />
                  ) : card.change < 0 ? (
                    <ArrowDownRight className={`w-4 h-4 ${card.invertColor ? 'text-emerald-400' : 'text-red-400'}`} />
                  ) : null}
                  <span className={
                    card.change > 0
                      ? (card.invertColor ? 'text-red-400' : 'text-emerald-400')
                      : card.change < 0
                        ? (card.invertColor ? 'text-emerald-400' : 'text-red-400')
                        : 'text-slate-400'
                  }>
                    {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}%
                  </span>
                  <span className="text-slate-500 text-sm">{card.changeLabel}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart (2 columns) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-px">
            <div className="bg-slate-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  MRR Growth
                </h2>
              </div>

              {/* Simple bar chart visualization */}
              <div className="h-64 flex items-end gap-2">
                {revenueByMonth.map((month, index) => {
                  const maxMrr = Math.max(...revenueByMonth.map(m => m.mrr))
                  const height = (month.mrr / maxMrr) * 100
                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg relative group cursor-pointer"
                      >
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          <p className="text-xs font-bold text-white">{formatCurrency(month.mrr)}</p>
                          <p className="text-xs text-emerald-400">+{formatCurrency(month.newMrr)} new</p>
                          <p className="text-xs text-red-400">-{formatCurrency(month.churnedMrr)} churned</p>
                        </div>
                      </motion.div>
                      <span className="text-xs text-slate-500">{month.month}</span>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-xs text-slate-400">New MRR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-xs text-slate-400">Expansion MRR</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-xs text-slate-400">Churned MRR</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tier Distribution (1 column) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-px">
            <div className="bg-slate-900 rounded-2xl p-6 h-full">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Plan Distribution
              </h2>

              {/* Visual pie representation */}
              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {tierDistribution.map((tier, index) => {
                    const percentage = stats.total > 0 ? (tier.value / stats.total) * 100 : 0
                    const previousPercentages = tierDistribution
                      .slice(0, index)
                      .reduce((sum, t) => sum + (stats.total > 0 ? (t.value / stats.total) * 100 : 0), 0)
                    const circumference = 2 * Math.PI * 40
                    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
                    const strokeDashoffset = -((previousPercentages / 100) * circumference)

                    return (
                      <circle
                        key={tier.name}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={tier.color}
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{stats.total}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-3">
                {tierDistribution.map((tier) => {
                  const percentage = stats.total > 0 ? ((tier.value / stats.total) * 100).toFixed(0) : 0
                  const revenue = tier.value * tier.price
                  return (
                    <div key={tier.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                        <span className="text-sm text-slate-300">{tier.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">{tier.value}</span>
                        <span className="text-xs text-slate-500 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Revenue by Tier */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Revenue by Tier</h3>
                <div className="space-y-2">
                  {tierDistribution.map((tier) => {
                    const revenue = tier.value * tier.price
                    const revenuePercentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
                    return (
                      <div key={tier.name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-400">{tier.name}</span>
                          <span className="text-white font-bold">{formatCurrency(revenue)}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${revenuePercentage}%`, backgroundColor: tier.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Status Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.byStatus.active}</p>
              <p className="text-xs text-slate-500">Active Paid</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.byStatus.trial}</p>
              <p className="text-xs text-slate-500">On Trial</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.trialExpiringSoon}</p>
              <p className="text-xs text-slate-500">Trial Expiring (7d)</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.byStatus.cancelled}</p>
              <p className="text-xs text-slate-500">Cancelled</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Subscriptions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-px">
          <div className="bg-slate-900 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                Recent Subscribers
              </h2>
              <Link
                href="/admin/customers"
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Customer</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Plan</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-500 uppercase">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.slice(0, 10).map((profile) => {
                    const tierPrice = tierPricing[profile.subscription_tier as keyof typeof tierPricing] || 0
                    return (
                      <tr key={profile.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {(profile.full_name || profile.email)[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{profile.full_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            profile.subscription_tier === 'enterprise'
                              ? 'bg-amber-500/20 text-amber-400'
                              : profile.subscription_tier === 'professional'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            profile.subscription_status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : profile.subscription_status === 'trial'
                                ? 'bg-blue-500/20 text-blue-400'
                                : profile.subscription_status === 'past_due'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-red-500/20 text-red-400'
                          }`}>
                            {profile.subscription_status.charAt(0).toUpperCase() + profile.subscription_status.slice(1).replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-slate-400">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-bold text-emerald-400">
                            {profile.subscription_status === 'trial' ? '$0' : formatCurrency(tierPrice)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
