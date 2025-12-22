/**
 * Customer Management Client Component
 * Comprehensive customer list with search, filter, and actions
 */

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Download,
  Mail,
  MoreVertical,
  User,
  Package,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Users,
  Shield
} from 'lucide-react'

interface Customer {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  subscription_tier: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string
  updated_at: string
  amazon_connected: boolean
  amazon_seller_name: string | null
}

interface CustomerManagementClientProps {
  admin: {
    id: string
    role: string
  }
  customers: Customer[]
}

export function CustomerManagementClient({ admin, customers }: CustomerManagementClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [amazonFilter, setAmazonFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c =>
        c.email?.toLowerCase().includes(query) ||
        c.full_name?.toLowerCase().includes(query) ||
        c.company_name?.toLowerCase().includes(query) ||
        c.amazon_seller_name?.toLowerCase().includes(query)
      )
    }

    // Tier filter
    if (tierFilter !== 'all') {
      result = result.filter(c => c.subscription_tier === tierFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.subscription_status === statusFilter)
    }

    // Amazon filter
    if (amazonFilter !== 'all') {
      result = result.filter(c =>
        amazonFilter === 'connected' ? c.amazon_connected : !c.amazon_connected
      )
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField as keyof Customer]
      const bVal = b[sortField as keyof Customer]

      if (aVal === null) return sortDirection === 'asc' ? -1 : 1
      if (bVal === null) return sortDirection === 'asc' ? 1 : -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return 0
    })

    return result
  }, [customers, searchQuery, tierFilter, statusFilter, amazonFilter, sortField, sortDirection])

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const toggleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set())
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedCustomers)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCustomers(newSelected)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full">Active</span>
      case 'trialing':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">Trial</span>
      case 'past_due':
        return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">Past Due</span>
      case 'canceled':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">Canceled</span>
      default:
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs font-bold rounded-full">{status}</span>
    }
  }

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">Enterprise</span>
      case 'professional':
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">Professional</span>
      case 'starter':
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs font-bold rounded-full">Starter</span>
      default:
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs font-bold rounded-full">{tier}</span>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const exportToCSV = () => {
    const headers = ['Email', 'Name', 'Company', 'Plan', 'Status', 'Amazon Connected', 'Created']
    const rows = filteredCustomers.map(c => [
      c.email,
      c.full_name || '',
      c.company_name || '',
      c.subscription_tier,
      c.subscription_status,
      c.amazon_connected ? 'Yes' : 'No',
      formatDate(c.created_at)
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Stats
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.subscription_status === 'active').length,
    trial: customers.filter(c => c.subscription_status === 'trialing').length,
    amazonConnected: customers.filter(c => c.amazon_connected).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-purple-400" />
            Customer Management
          </h1>
          <p className="text-slate-400 mt-1">
            Manage and monitor all SellerGenix customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {selectedCustomers.size > 0 && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all">
              <Mail className="w-4 h-4" />
              Email ({selectedCustomers.size})
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase mb-1">Total Customers</p>
          <p className="text-2xl font-black text-white">{stats.total}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase mb-1">Active</p>
          <p className="text-2xl font-black text-emerald-400">{stats.active}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase mb-1">On Trial</p>
          <p className="text-2xl font-black text-blue-400">{stats.trial}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase mb-1">Amazon Connected</p>
          <p className="text-2xl font-black text-amber-400">{stats.amazonConnected}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, name, company, or seller name..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${
              showFilters || tierFilter !== 'all' || statusFilter !== 'all' || amazonFilter !== 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(tierFilter !== 'all' || statusFilter !== 'all' || amazonFilter !== 'all') && (
              <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
                {[tierFilter, statusFilter, amazonFilter].filter(f => f !== 'all').length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tier Filter */}
                <div>
                  <label className="block text-xs text-slate-500 uppercase mb-2">Plan</label>
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Plans</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs text-slate-500 uppercase mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="trialing">Trial</option>
                    <option value="past_due">Past Due</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>

                {/* Amazon Filter */}
                <div>
                  <label className="block text-xs text-slate-500 uppercase mb-2">Amazon</label>
                  <select
                    value={amazonFilter}
                    onChange={(e) => setAmazonFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All</option>
                    <option value="connected">Connected</option>
                    <option value="not_connected">Not Connected</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-slate-400">
          Showing <span className="text-white font-bold">{filteredCustomers.length}</span> of {customers.length} customers
        </p>
        {selectedCustomers.size > 0 && (
          <p className="text-purple-400">
            {selectedCustomers.size} selected
          </p>
        )}
      </div>

      {/* Customer Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-4 px-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />
                </th>
                <th
                  className="py-4 px-4 text-left text-xs font-bold text-slate-400 uppercase cursor-pointer hover:text-white"
                  onClick={() => toggleSort('email')}
                >
                  <div className="flex items-center gap-2">
                    Customer
                    {sortField === 'email' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </th>
                <th className="py-4 px-4 text-left text-xs font-bold text-slate-400 uppercase">Plan</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-slate-400 uppercase">Status</th>
                <th className="py-4 px-4 text-left text-xs font-bold text-slate-400 uppercase">Amazon</th>
                <th
                  className="py-4 px-4 text-left text-xs font-bold text-slate-400 uppercase cursor-pointer hover:text-white"
                  onClick={() => toggleSort('created_at')}
                >
                  <div className="flex items-center gap-2">
                    Joined
                    {sortField === 'created_at' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </th>
                <th className="py-4 px-4 text-right text-xs font-bold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">
                          {(customer.full_name || customer.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {customer.full_name || 'No name'}
                        </p>
                        <p className="text-xs text-slate-500">{customer.email}</p>
                        {customer.company_name && (
                          <p className="text-xs text-slate-600">{customer.company_name}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getTierBadge(customer.subscription_tier)}
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(customer.subscription_status)}
                  </td>
                  <td className="py-4 px-4">
                    {customer.amazon_connected ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-emerald-400">
                          {customer.amazon_seller_name || 'Connected'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-500">Not connected</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-400">
                      {formatDate(customer.created_at)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="Send email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No customers found</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}
