'use client'

import React from 'react'
import { TrendingUp, TrendingDown, ChevronRight, Minus } from 'lucide-react'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

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
  // Fee source and breakdown (Phase 1.8) - Sellerboard Parity
  feeSource?: 'real' | 'estimated' | 'mixed'
  feeBreakdown?: {
    // === AMAZON FEES (charges) ===
    fbaFulfillment: number      // FBA per-unit fulfillment fee
    mcf: number                 // Multi-Channel Fulfillment (SEPARATE from FBA!)
    referral: number            // Amazon commission (8-15%)
    storage: number             // Monthly FBA storage
    longTermStorage: number     // Long-term storage (6+ months) - SEPARATE!
    inbound: number             // Inbound placement/convenience fee
    removal: number             // Disposal/removal fee
    digitalServices: number     // Digital services fee
    refundCommission: number    // Refund commission charge
    returns: number             // Return processing fees
    chargebacks: number         // Chargebacks
    other: number               // Other miscellaneous fees
    // === REIMBURSEMENTS (credits - positive values) ===
    warehouseDamage: number     // Warehouse damage reimbursement
    warehouseLost: number       // Warehouse lost reimbursement
    reversalReimbursement: number // Reversal/compensation
    refundedReferral: number    // Referral fee refunded back to seller
    // === PROMO (separate from Amazon fees) ===
    promo: number               // Promotional discounts
    // Legacy field for backward compatibility
    reimbursements: number
  }
  serviceFees?: {
    subscription: number
    storage: number
    other: number
    total: number
  }
  // Ads breakdown from Amazon Advertising API (SP/SB/SBV/SD)
  adsBreakdown?: {
    sponsoredProducts: number      // SP campaigns
    sponsoredBrands: number        // SB campaigns
    sponsoredBrandsVideo: number   // SBV campaigns
    sponsoredDisplay: number       // SD campaigns
    total: number                  // Total ad spend (should match adSpend)
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
      return <TrendingUp className="w-3.5 h-3.5" />
    } else if (data.netProfitChange < 0) {
      return <TrendingDown className="w-3.5 h-3.5" />
    }
    return <Minus className="w-3.5 h-3.5" />
  }

  // Calculate refund metrics once
  const avgUnitPrice = data.units > 0 ? data.sales / data.units : 0
  const refundCount = data.refundCount ?? (avgUnitPrice > 0 ? Math.round(data.refunds / avgUnitPrice) : 0)
  const refundRate = data.units > 0 ? (refundCount / data.units) * 100 : 0

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl transition-all duration-300 cursor-pointer"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`
          : STARBUCKS.cream,
        border: isSelected ? 'none' : `1px solid ${STARBUCKS.lightGreen}`,
        boxShadow: isSelected
          ? `0 20px 40px -12px rgba(30, 57, 50, 0.35)`
          : '0 4px 12px rgba(0, 0, 0, 0.05)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Premium glow effect for selected card */}
      {isSelected && (
        <div
          className="absolute -inset-[1px] rounded-2xl opacity-30 blur-sm"
          style={{ background: `linear-gradient(135deg, ${STARBUCKS.gold} 0%, ${STARBUCKS.primaryGreen} 100%)` }}
        />
      )}

      <div className={`relative p-6 ${isSelected ? 'text-white' : ''}`}>
        {/* Header Row */}
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-1">
            <h3
              className="text-sm font-semibold tracking-tight"
              style={{ color: isSelected ? STARBUCKS.white : STARBUCKS.darkGreen }}
            >
              {data.label}
            </h3>
            <p
              className="text-xs font-medium"
              style={{ color: isSelected ? 'rgba(255,255,255,0.6)' : STARBUCKS.primaryGreen }}
            >
              {formatDateRange()}
            </p>
          </div>

          {/* Trend Badge */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: isSelected
                ? data.netProfitChange > 0
                  ? 'rgba(212, 233, 226, 0.2)'
                  : data.netProfitChange < 0
                    ? 'rgba(220, 38, 38, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)'
                : data.netProfitChange > 0
                  ? STARBUCKS.lightGreen
                  : data.netProfitChange < 0
                    ? '#FEE2E2'
                    : '#F3F4F6',
              color: isSelected
                ? data.netProfitChange > 0
                  ? STARBUCKS.lightGreen
                  : data.netProfitChange < 0
                    ? '#FCA5A5'
                    : 'rgba(255,255,255,0.7)'
                : data.netProfitChange > 0
                  ? STARBUCKS.primaryGreen
                  : data.netProfitChange < 0
                    ? '#DC2626'
                    : '#6B7280',
              border: `1px solid ${isSelected
                ? data.netProfitChange > 0
                  ? 'rgba(212, 233, 226, 0.3)'
                  : data.netProfitChange < 0
                    ? 'rgba(220, 38, 38, 0.3)'
                    : 'rgba(255, 255, 255, 0.2)'
                : data.netProfitChange > 0
                  ? STARBUCKS.primaryGreen + '30'
                  : data.netProfitChange < 0
                    ? '#DC262630'
                    : '#E5E7EB'
              }`,
            }}
          >
            {getTrendIcon()}
            <span>{data.netProfitChange >= 0 ? '+' : ''}{data.netProfitChange.toFixed(1)}%</span>
          </div>
        </div>

        {/* Main Metric - Net Profit (Hero) */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <p
              className="text-4xl font-bold tracking-tight"
              style={{
                color: isSelected
                  ? STARBUCKS.white
                  : data.netProfit >= 0
                    ? STARBUCKS.darkGreen
                    : '#DC2626'
              }}
            >
              {formatCurrency(data.netProfit)}
            </p>
          </div>
          <p
            className="text-xs font-medium mt-1"
            style={{ color: isSelected ? 'rgba(255,255,255,0.6)' : STARBUCKS.primaryGreen }}
          >
            Net Profit
          </p>
        </div>

        {/* Divider */}
        <div
          className="h-px mb-4"
          style={{ background: isSelected ? 'rgba(255,255,255,0.15)' : STARBUCKS.lightGreen }}
        />

        {/* Stats Grid - Refined Layout */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* Sales */}
          <div className="space-y-0.5">
            <p
              className="text-xs font-medium"
              style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : STARBUCKS.primaryGreen + 'AA' }}
            >
              Sales
            </p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : STARBUCKS.darkGreen }}
            >
              {formatCurrency(data.sales)}
            </p>
          </div>

          {/* Orders */}
          <div className="space-y-0.5">
            <p
              className="text-xs font-medium"
              style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : STARBUCKS.primaryGreen + 'AA' }}
            >
              Orders
            </p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : STARBUCKS.darkGreen }}
            >
              {data.orders.toLocaleString()}
            </p>
          </div>

          {/* Units */}
          <div className="space-y-0.5">
            <p
              className="text-xs font-medium"
              style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : STARBUCKS.primaryGreen + 'AA' }}
            >
              Units
            </p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : STARBUCKS.darkGreen }}
            >
              {data.units.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* ACOS */}
          <div className="space-y-0.5">
            <p
              className="text-xs font-medium"
              style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : STARBUCKS.primaryGreen + 'AA' }}
            >
              ACOS
            </p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{
                color: isSelected
                  ? data.acos > 30 ? '#FCA5A5' : data.acos > 20 ? STARBUCKS.gold : STARBUCKS.lightGreen
                  : data.acos > 30 ? '#DC2626' : data.acos > 20 ? '#D97706' : STARBUCKS.primaryGreen
              }}
            >
              {data.acos.toFixed(1)}%
            </p>
          </div>

          {/* Refunds */}
          <div className="space-y-0.5">
            <p
              className="text-xs font-medium"
              style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : STARBUCKS.primaryGreen + 'AA' }}
            >
              Refunds
            </p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{
                color: isSelected
                  ? refundCount > 0 ? '#FCA5A5' : 'rgba(255,255,255,0.9)'
                  : refundCount > 0 ? '#DC2626' : STARBUCKS.darkGreen
              }}
            >
              {refundCount}
            </p>
          </div>

          {/* Refund Rate */}
          <div className="space-y-0.5">
            <p
              className="text-xs font-medium"
              style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : STARBUCKS.primaryGreen + 'AA' }}
            >
              Refund %
            </p>
            <p
              className="text-sm font-semibold tabular-nums"
              style={{
                color: isSelected
                  ? refundRate > 5 ? '#FCA5A5' : refundRate > 2 ? STARBUCKS.gold : STARBUCKS.lightGreen
                  : refundRate > 5 ? '#DC2626' : refundRate > 2 ? '#D97706' : STARBUCKS.primaryGreen
              }}
            >
              {refundRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* More Details Button - Gold Accent */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onMoreClick()
          }}
          className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group/btn"
          style={{
            background: isSelected
              ? `linear-gradient(135deg, ${STARBUCKS.gold} 0%, ${STARBUCKS.gold}DD 100%)`
              : STARBUCKS.lightGreen,
            color: isSelected ? STARBUCKS.darkGreen : STARBUCKS.primaryGreen,
            border: `1px solid ${isSelected ? STARBUCKS.gold : STARBUCKS.primaryGreen + '20'}`,
          }}
        >
          <span>View Breakdown</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
