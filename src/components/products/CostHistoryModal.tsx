'use client'

/**
 * Cost History Modal
 * Display historical cost changes with timeline view
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  History,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  FileText,
  Package,
  Truck,
  Warehouse,
  Edit3,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface CostHistoryEntry {
  id: string
  date: string
  cogs: number
  warehouseCost: number
  customTaxCost: number
  logisticsCost: number
  totalCost: number
  notes?: string
  changedBy?: string
}

interface CostHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  userId: string
}

export function CostHistoryModal({
  isOpen,
  onClose,
  product,
  userId
}: CostHistoryModalProps) {
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<CostHistoryEntry[]>([])
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  // Mock data - in production, fetch from Supabase
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        // Generate mock historical data
        const mockHistory: CostHistoryEntry[] = [
          {
            id: '1',
            date: new Date().toISOString(),
            cogs: product.cogs || 15.00,
            warehouseCost: 2.50,
            customTaxCost: 1.20,
            logisticsCost: 3.50,
            totalCost: product.total_cost || product.cogs || 22.20,
            notes: 'Current cost structure',
            changedBy: 'System'
          },
          {
            id: '2',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            cogs: (product.cogs || 15.00) * 1.1,
            warehouseCost: 2.80,
            customTaxCost: 1.30,
            logisticsCost: 4.00,
            totalCost: ((product.cogs || 15.00) * 1.1) + 8.10,
            notes: 'Negotiated better rates with supplier',
            changedBy: 'User'
          },
          {
            id: '3',
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            cogs: (product.cogs || 15.00) * 1.2,
            warehouseCost: 3.00,
            customTaxCost: 1.40,
            logisticsCost: 4.50,
            totalCost: ((product.cogs || 15.00) * 1.2) + 8.90,
            notes: 'Initial cost entry',
            changedBy: 'User'
          }
        ]
        setHistory(mockHistory)
        setLoading(false)
      }, 500)
    }
  }, [isOpen, product])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl pointer-events-auto max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <History className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">Cost History</h2>
                    <p className="text-sm text-slate-400 truncate max-w-[300px]">{product.title}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-88px)]">
                {/* Product Summary */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{product.title || 'Untitled Product'}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="font-mono text-slate-500">ASIN: {product.asin}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-emerald-400 font-bold">
                          Current: ${(product.total_cost || product.cogs || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {loading ? (
                  <div className="py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-purple-500 border-t-transparent"></div>
                    <p className="mt-4 text-slate-400">Loading history...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-12 text-center">
                    <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-lg font-bold text-white mb-2">No History Yet</p>
                    <p className="text-slate-400">Cost changes will appear here as you update product costs.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-slate-700"></div>

                    {/* Timeline entries */}
                    <div className="space-y-6">
                      {history.map((entry, index) => {
                        const isFirst = index === 0
                        const previousEntry = history[index + 1]
                        const changePercent = previousEntry
                          ? getChangePercentage(entry.totalCost, previousEntry.totalCost)
                          : 0
                        const isExpanded = expandedEntry === entry.id

                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative pl-16"
                          >
                            {/* Timeline dot */}
                            <div className={`absolute left-4 top-4 w-5 h-5 rounded-full border-2 ${
                              isFirst
                                ? 'bg-gradient-to-br from-purple-500 to-blue-500 border-purple-400'
                                : 'bg-slate-800 border-slate-600'
                            }`}>
                              {isFirst && (
                                <div className="absolute inset-0 rounded-full animate-ping bg-purple-500/50"></div>
                              )}
                            </div>

                            {/* Entry card */}
                            <div className={`bg-slate-800/50 border rounded-xl overflow-hidden transition-all ${
                              isFirst ? 'border-purple-500/30' : 'border-slate-700/50'
                            }`}>
                              {/* Entry header */}
                              <button
                                onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Calendar className="w-4 h-4 text-slate-500" />
                                      <span className="font-bold text-white">{formatDate(entry.date)}</span>
                                      <span className="text-xs text-slate-500">{formatTime(entry.date)}</span>
                                      {isFirst && (
                                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    {entry.notes && (
                                      <p className="text-sm text-slate-400">{entry.notes}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-lg font-black text-emerald-400">${entry.totalCost.toFixed(2)}</p>
                                    {previousEntry && (
                                      <div className={`flex items-center justify-end gap-1 text-sm ${
                                        changePercent < 0 ? 'text-emerald-400' : 'text-red-400'
                                      }`}>
                                        {changePercent < 0 ? (
                                          <TrendingDown className="w-3 h-3" />
                                        ) : (
                                          <TrendingUp className="w-3 h-3" />
                                        )}
                                        <span className="font-bold">{Math.abs(changePercent).toFixed(1)}%</span>
                                      </div>
                                    )}
                                  </div>
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                              </button>

                              {/* Expanded details */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t border-slate-700/50"
                                  >
                                    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                      {/* COGS */}
                                      <div className="bg-slate-900/50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <DollarSign className="w-4 h-4 text-blue-400" />
                                          <span className="text-xs text-slate-500 uppercase tracking-wider">COGS</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">${entry.cogs.toFixed(2)}</p>
                                      </div>

                                      {/* Warehouse */}
                                      <div className="bg-slate-900/50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Warehouse className="w-4 h-4 text-amber-400" />
                                          <span className="text-xs text-slate-500 uppercase tracking-wider">3PL</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">${entry.warehouseCost.toFixed(2)}</p>
                                      </div>

                                      {/* Custom Tax */}
                                      <div className="bg-slate-900/50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <FileText className="w-4 h-4 text-green-400" />
                                          <span className="text-xs text-slate-500 uppercase tracking-wider">Tax</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">${entry.customTaxCost.toFixed(2)}</p>
                                      </div>

                                      {/* Logistics */}
                                      <div className="bg-slate-900/50 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Truck className="w-4 h-4 text-red-400" />
                                          <span className="text-xs text-slate-500 uppercase tracking-wider">Logistics</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">${entry.logisticsCost.toFixed(2)}</p>
                                      </div>
                                    </div>

                                    {/* Changed by */}
                                    <div className="px-4 pb-4">
                                      <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Changed by: <span className="text-slate-400">{entry.changedBy}</span></span>
                                        <span className="font-mono">{entry.id}</span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      <p className="font-bold mb-1">Cost Versioning</p>
                      <p className="text-slate-400">
                        SellerGenix automatically tracks all cost changes over time. Use historical
                        costs to match with Amazon's sales data for accurate profit calculations by date range.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
