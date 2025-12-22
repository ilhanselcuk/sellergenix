/**
 * Admin Dashboard Client Component
 * Comprehensive KPI metrics with premium dark theme
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Activity,
  Package,
  AlertCircle,
  Clock,
  ChevronRight,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  Shield,
  Mail,
  Eye
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  can_view_revenue: boolean
}

interface DashboardStats {
  totalUsers: number
  tierCounts: {
    starter: number
    professional: number
    enterprise: number
  }
  newUsersToday: number
  newUsersWeek: number
  totalConnections: number
  recentLogs: Array<{
    id: string
    action: string
    actor_email: string
    actor_name: string
    created_at: string
    resource_type?: string
  }>
  mrr: number
  arr: number
  churnRate: number
  avgRevenuePerUser: number
}

interface AdminDashboardClientProps {
  admin: AdminUser
  stats: DashboardStats
}

export function AdminDashboardClient({ admin, stats }: AdminDashboardClientProps) {
  const [refreshing, setRefreshing] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  // KPI Cards Data
  const kpiCards = [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      change: stats.newUsersWeek,
      changeLabel: 'this week',
      positive: true,
      icon: Users,
      gradient: 'from-purple-600 to-blue-600',
      href: '/admin/customers'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.mrr),
      change: 0,
      changeLabel: 'vs last month',
      positive: true,
      icon: DollarSign,
      gradient: 'from-emerald-600 to-green-600',
      href: '/admin/analytics',
      requiresRevenue: true
    },
    {
      title: 'Active Subscriptions',
      value: formatNumber(stats.tierCounts.professional + stats.tierCounts.enterprise),
      change: 0,
      changeLabel: 'paid users',
      positive: true,
      icon: CreditCard,
      gradient: 'from-blue-600 to-cyan-600',
      href: '/admin/subscriptions'
    },
    {
      title: 'Amazon Connections',
      value: formatNumber(stats.totalConnections),
      change: 0,
      changeLabel: 'active',
      positive: true,
      icon: Package,
      gradient: 'from-amber-600 to-orange-600',
      href: '/admin/amazon'
    }
  ]

  // Quick Stats
  const quickStats = [
    { label: 'New Today', value: stats.newUsersToday, icon: UserPlus, color: 'text-emerald-400' },
    { label: 'Starter Plan', value: stats.tierCounts.starter, icon: Users, color: 'text-slate-400' },
    { label: 'Professional', value: stats.tierCounts.professional, icon: Shield, color: 'text-purple-400' },
    { label: 'Enterprise', value: stats.tierCounts.enterprise, icon: Shield, color: 'text-amber-400' }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">
            Welcome back, {admin.full_name.split(' ')[0]}
          </h1>
          <p className="text-slate-400 mt-1">
            Here's what's happening with SellerGenix today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          <button
            onClick={() => window.location.reload()}
            className={`p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => {
          if (card.requiresRevenue && !admin.can_view_revenue) return null

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={card.href}>
                <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-px hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group`}>
                  <div className="bg-slate-900 rounded-2xl p-5 h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-slate-400 mb-1">{card.title}</p>
                    <p className="text-3xl font-black text-white mb-2">{card.value}</p>
                    {card.change !== undefined && (
                      <div className="flex items-center gap-1">
                        {card.positive ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-400" />
                        )}
                        <span className={card.positive ? 'text-emerald-400' : 'text-red-400'}>
                          +{card.change}
                        </span>
                        <span className="text-slate-500 text-sm">{card.changeLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-px">
            <div className="bg-slate-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Recent Activity
                </h2>
                <Link
                  href="/admin/audit-logs"
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {stats.recentLogs.length > 0 ? (
                  stats.recentLogs.slice(0, 8).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        log.action.includes('login') ? 'bg-emerald-400' :
                        log.action.includes('create') ? 'bg-blue-400' :
                        log.action.includes('update') ? 'bg-amber-400' :
                        log.action.includes('delete') ? 'bg-red-400' :
                        'bg-slate-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {log.action.replace(/\./g, ' ').replace(/\_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {log.actor_name || log.actor_email || 'System'}
                          {log.resource_type && ` • ${log.resource_type}`}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {getTimeAgo(log.created_at)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl p-px">
            <div className="bg-slate-900 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Quick Actions
              </h2>

              <div className="space-y-3">
                <Link
                  href="/admin/customers"
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Manage Customers</p>
                    <p className="text-xs text-slate-500">View and edit users</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/admin/emails"
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Send Email</p>
                    <p className="text-xs text-slate-500">Notify customers</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/admin/announcements"
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Announcements</p>
                    <p className="text-xs text-slate-500">Create alerts</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/admin/audit-logs"
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Audit Logs</p>
                    <p className="text-xs text-slate-500">System activity</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">API Status</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm text-emerald-400 font-medium">Operational</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Database</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm text-emerald-400 font-medium">Healthy</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Amazon SP-API</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm text-emerald-400 font-medium">Connected</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
