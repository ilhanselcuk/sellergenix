'use client'

import React from 'react'
import { TrendingUp, TrendingDown, ChevronDown, Minus } from 'lucide-react'

export interface PeriodData {
  label: string
  startDate: Date
  endDate: Date
  netProfit: number
  netProfitChange: number // percentage
  sales: number
  orders: number
  units: number
  acos: number
  adSpend: number
  refunds: number // Dollar amount of refunds
  refundCount?: number // Number of refunded units (optional, can be estimated)
  amazonFees: number
  cogs: number
  grossProfit: number
  // Fee source and breakdown (Phase 1.8)
  feeSource?: 'real' | 'estimated' | 'mixed'
  feeBreakdown?: {
    fbaFulfillment: number
    referral: number
    storage: number
    inbound: number
    removal: number
    returns: number
    chargebacks: number
    other: number
    reimbursements: number
  }
  serviceFees?: {
    subscription: number
    storage: number
    other: number
    total: number
  }
}

interface PeriodCardProps {
  data: PeriodData
  isSelected: boolean
  onClick: () => void
  onMoreClick: () => void
}

export default function PeriodCard({ data, isSelected, onClick, onMoreClick }: PeriodCardProps) {
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatDateRange = () => {
    const start = formatDate(data.startDate)
    const end = formatDate(data.endDate)
    if (start === end) return start
    return `${start} - ${end}`
  }

  const getTrendIcon = () => {
    if (data.netProfitChange > 0) {
      return <TrendingUp className="w-4 h-4" />
    } else if (data.netProfitChange < 0) {
      return <TrendingDown className="w-4 h-4" />
    }
    return <Minus className="w-4 h-4" />
  }

  const getTrendColor = () => {
    if (data.netProfitChange > 0) return 'text-emerald-600 bg-emerald-50'
    if (data.netProfitChange < 0) return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative bg-white rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden
        ${isSelected
          ? 'border-blue-500 shadow-lg shadow-blue-500/10'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{data.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{formatDateRange()}</p>
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(data.netProfitChange).toFixed(1)}%</span>
          </div>
        </div>

        {/* Main Metric - Net Profit */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Net Profit</p>
          <p className={`text-3xl font-bold tracking-tight ${data.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(data.netProfit)}
          </p>
        </div>

        {/* Mini Stats Grid - 3 rows x 2 cols */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <p className="text-xs text-gray-500">Sales</p>
            <p className="font-semibold text-gray-900">{formatCurrency(data.sales)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Orders</p>
            <p className="font-semibold text-gray-900">{data.orders.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Units</p>
            <p className="font-semibold text-gray-900">{data.units.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ACOS</p>
            <p className={`font-semibold ${data.acos > 30 ? 'text-red-600' : data.acos > 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {data.acos.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Refunds</p>
            <p className={`font-semibold ${data.refunds > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {(() => {
                // Calculate estimated refund count from $ amount
                const avgUnitPrice = data.units > 0 ? data.sales / data.units : 0
                const estimatedCount = data.refundCount ?? (avgUnitPrice > 0 ? Math.round(data.refunds / avgUnitPrice) : 0)
                return estimatedCount
              })()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Refund %</p>
            <p className={`font-semibold ${(() => {
              const avgUnitPrice = data.units > 0 ? data.sales / data.units : 0
              const estimatedCount = data.refundCount ?? (avgUnitPrice > 0 ? Math.round(data.refunds / avgUnitPrice) : 0)
              const rate = data.units > 0 ? (estimatedCount / data.units) * 100 : 0
              return rate > 5 ? 'text-red-600' : rate > 2 ? 'text-amber-600' : 'text-emerald-600'
            })()}`}>
              {(() => {
                const avgUnitPrice = data.units > 0 ? data.sales / data.units : 0
                const estimatedCount = data.refundCount ?? (avgUnitPrice > 0 ? Math.round(data.refunds / avgUnitPrice) : 0)
                const rate = data.units > 0 ? (estimatedCount / data.units) * 100 : 0
                return rate.toFixed(1) + '%'
              })()}
            </p>
          </div>
        </div>

        {/* More Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMoreClick()
          }}
          className="mt-4 w-full flex items-center justify-center gap-1 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span>More Details</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
