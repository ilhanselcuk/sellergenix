/**
 * Audit Logs Client Component
 * Comprehensive audit log viewer with filtering and search
 */

'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Search,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
  User,
  Activity,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
}

interface AuditLog {
  id: string
  action: string
  actor_type: string
  actor_id: string | null
  actor_email: string | null
  actor_name: string | null
  resource_type: string | null
  resource_id: string | null
  details: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface Stats {
  total: number
  today: number
  week: number
  failedLogins: number
}

interface AuditLogsClientProps {
  admin: AdminUser
  logs: AuditLog[]
  stats: Stats
}

export function AuditLogsClient({ admin, logs, stats }: AuditLogsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // Get unique actions for filter
  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(log => log.action))
    return Array.from(actions).sort()
  }, [logs])

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          log.action.toLowerCase().includes(query) ||
          log.actor_email?.toLowerCase().includes(query) ||
          log.actor_name?.toLowerCase().includes(query) ||
          log.resource_type?.toLowerCase().includes(query) ||
          log.ip_address?.includes(query)
        if (!matchesSearch) return false
      }

      // Action filter
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false
      }

      // Period filter
      if (selectedPeriod !== 'all') {
        const logDate = new Date(log.created_at)
        const now = new Date()

        if (selectedPeriod === 'today') {
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          if (logDate < today) return false
        } else if (selectedPeriod === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          if (logDate < weekAgo) return false
        } else if (selectedPeriod === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          if (logDate < monthAgo) return false
        }
      }

      return true
    })
  }, [logs, searchQuery, selectedAction, selectedPeriod])

  // Get action icon and color
  const getActionStyle = (action: string) => {
    if (action.includes('login.success')) {
      return { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' }
    }
    if (action.includes('login.failed')) {
      return { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' }
    }
    if (action.includes('create')) {
      return { icon: CheckCircle, color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
    }
    if (action.includes('update') || action.includes('edit')) {
      return { icon: Info, color: 'text-amber-400', bgColor: 'bg-amber-500/20' }
    }
    if (action.includes('delete')) {
      return { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20' }
    }
    if (action.includes('view') || action.includes('read')) {
      return { icon: Eye, color: 'text-slate-400', bgColor: 'bg-slate-500/20' }
    }
    return { icon: Activity, color: 'text-purple-400', bgColor: 'bg-purple-500/20' }
  }

  // Format timestamp
  const formatTime = (date: string) => {
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Timestamp', 'Action', 'Actor', 'Email', 'Resource', 'IP Address']
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toISOString(),
      log.action,
      log.actor_name || 'System',
      log.actor_email || '-',
      log.resource_type ? `${log.resource_type}:${log.resource_id || ''}` : '-',
      log.ip_address || '-'
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Shield className="w-7 h-7 text-purple-400" />
            Audit Logs
          </h1>
          <p className="text-slate-400 mt-1">Immutable security and activity logs</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold text-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.total.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Total Events</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.today}</p>
              <p className="text-xs text-slate-500">Today</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.week}</p>
              <p className="text-xs text-slate-500">This Week</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{stats.failedLogins}</p>
              <p className="text-xs text-slate-500">Failed Logins (7d)</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, user, IP address..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="appearance-none w-full md:w-48 px-4 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action.replace(/\./g, ' ').replace(/\_/g, ' ')}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Period Filter */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none w-full md:w-40 px-4 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {/* Logs List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-2xl p-px">
          <div className="bg-slate-900 rounded-2xl overflow-hidden">
            {/* Results count */}
            <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                Showing {filteredLogs.length} of {logs.length} events
              </span>
            </div>

            {/* Log entries */}
            <div className="divide-y divide-slate-800">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => {
                  const { icon: Icon, color, bgColor } = getActionStyle(log.action)
                  const isExpanded = expandedLog === log.id

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`transition-colors ${isExpanded ? 'bg-slate-800/50' : 'hover:bg-slate-800/30'}`}
                    >
                      <div
                        className="px-6 py-4 cursor-pointer"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Icon */}
                          <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                          </div>

                          {/* Main content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-white">
                                {log.action.replace(/\./g, ' ').replace(/\_/g, ' ')}
                              </span>
                              {log.resource_type && (
                                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                                  {log.resource_type}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {log.actor_name || log.actor_email || 'System'}
                              </span>
                              {log.ip_address && (
                                <span>IP: {log.ip_address}</span>
                              )}
                            </div>
                          </div>

                          {/* Timestamp & expand */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {formatTime(log.created_at)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-4"
                        >
                          <div className="bg-slate-800/50 rounded-xl p-4 ml-14">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-slate-500 uppercase mb-1">Actor ID</p>
                                <p className="text-slate-300 font-mono text-xs">
                                  {log.actor_id || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase mb-1">Actor Type</p>
                                <p className="text-slate-300">{log.actor_type || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase mb-1">Resource ID</p>
                                <p className="text-slate-300 font-mono text-xs">
                                  {log.resource_id || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 uppercase mb-1">User Agent</p>
                                <p className="text-slate-300 truncate text-xs" title={log.user_agent || ''}>
                                  {log.user_agent ? log.user_agent.substring(0, 50) + '...' : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-700">
                                <p className="text-xs text-slate-500 uppercase mb-2">Details</p>
                                <pre className="text-xs text-slate-300 bg-slate-900 rounded-lg p-3 overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })
              ) : (
                <div className="py-12 text-center">
                  <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No audit logs found</p>
                  <p className="text-sm text-slate-600 mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>

            {/* Load more (future pagination) */}
            {filteredLogs.length >= 500 && (
              <div className="px-6 py-4 border-t border-slate-800 text-center">
                <p className="text-sm text-slate-500">
                  Showing first 500 results. Export to CSV for complete data.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
