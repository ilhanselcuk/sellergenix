'use client'

import React, { useState } from 'react'
import { X, ChevronDown, ChevronRight, DollarSign, Package, ShoppingCart, TrendingUp, Percent, BarChart3 } from 'lucide-react'
import { PeriodData } from './PeriodCard'

interface DetailedBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  data: PeriodData | null
}

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  total: number | string
  totalColor?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({ title, icon, total, totalColor = 'text-gray-900', children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          <span className="text-gray-500">{icon}</span>
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <span className={`font-semibold ${totalColor}`}>{total}</span>
      </button>
      {isOpen && (
        <div className="pb-3 pl-11 pr-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  )
}

function MetricRow({ label, value, valueColor = 'text-gray-700', indent = false }: { label: string; value: string; valueColor?: string; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${indent ? 'pl-4 border-l-2 border-gray-200' : ''}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
    </div>
  )
}

export default function DetailedBreakdownModal({ isOpen, onClose, data }: DetailedBreakdownModalProps) {
  if (!isOpen || !data) return null

  const formatCurrency = (value: number, showSign = false) => {
    const formatted = Math.abs(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
    if (showSign && value !== 0) {
      return value < 0 ? `-${formatted}` : `+${formatted}`
    }
    return value < 0 ? `-${formatted}` : formatted
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`

  // Amazon Fees breakdown - use real data when available (real or mixed), otherwise estimate
  const hasRealFeeBreakdown = (data.feeSource === 'real' || data.feeSource === 'mixed') && data.feeBreakdown && (
    data.feeBreakdown.fbaFulfillment > 0 || data.feeBreakdown.referral > 0 || data.feeBreakdown.chargebacks > 0
  )

  const amazonFeesBreakdown = hasRealFeeBreakdown
    ? {
        fbaFulfillment: data.feeBreakdown!.fbaFulfillment,
        referralFee: data.feeBreakdown!.referral,
        storageFee: data.feeBreakdown!.storage,
        inboundFee: data.feeBreakdown!.inbound,
        removalFee: data.feeBreakdown!.removal,
        returnsFee: data.feeBreakdown!.returns,
        chargebacksFee: data.feeBreakdown!.chargebacks,
        otherFee: data.feeBreakdown!.other,
        reimbursements: data.feeBreakdown!.reimbursements,
      }
    : {
        // Estimated percentages (fallback)
        fbaFulfillment: data.amazonFees * 0.55,
        referralFee: data.amazonFees * 0.35,
        storageFee: data.amazonFees * 0.05,
        inboundFee: data.amazonFees * 0.03,
        removalFee: 0,
        returnsFee: data.amazonFees * 0.02,
        chargebacksFee: 0,
        otherFee: 0,
        reimbursements: 0,
      }

  // Fee source indicator for UI
  const feeSourceLabel = data.feeSource === 'real' ? '✓ Real' : data.feeSource === 'mixed' ? '⚠ Mixed' : '~ Est.'

  // Calculated metrics (based on available data)
  const margin = data.sales > 0 ? (data.netProfit / data.sales) * 100 : 0
  // ROI calculated with COGS only (Ad Spend not available yet)
  const roi = data.cogs > 0 ? (data.netProfit / data.cogs) * 100 : 0
  // Refund rate based on refund count vs units
  const refundRate = data.units > 0 ? (data.refunds / data.units) * 100 : 0
  const estPayout = data.sales - data.amazonFees - data.refunds

  // Helper for "Coming Soon" display
  const comingSoon = (label: string) => `$0.00 (${label})`
  const comingSoonPercent = (label: string) => `0.0% (${label})`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{data.label} - Full Breakdown</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {data.startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {data.startDate.toDateString() !== data.endDate.toDateString() && (
                <> - {data.endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Revenue Section */}
          <div className="px-2 py-4 border-b border-gray-200">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Revenue</h3>

            {/* Sales - Real data from Amazon Orders API */}
            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-gray-500"><DollarSign className="w-4 h-4" /></span>
                <span className="font-medium text-gray-900">Sales</span>
              </div>
              <span className="font-semibold text-emerald-600">{formatCurrency(data.sales)}</span>
            </div>

            {/* Units - Real data from Amazon Orders API */}
            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-gray-500"><Package className="w-4 h-4" /></span>
                <span className="font-medium text-gray-900">Units</span>
              </div>
              <span className="font-semibold text-gray-900">{data.units.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-gray-500"><ShoppingCart className="w-4 h-4" /></span>
                <span className="font-medium text-gray-900">Orders</span>
              </div>
              <span className="font-semibold text-gray-900">{data.orders.toLocaleString()}</span>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="px-2 py-4 border-b border-gray-200">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Deductions</h3>

            {/* Ad Spend - Requires Advertising API (Coming Soon) */}
            <div className="flex items-center justify-between py-3 px-4 bg-amber-50/50 rounded-lg mx-2">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-gray-400"><BarChart3 className="w-4 h-4" /></span>
                <span className="font-medium text-gray-500">Ad Spend</span>
              </div>
              <span className="font-medium text-amber-600">$0.00 <span className="text-xs">(Coming Soon)</span></span>
            </div>

            <CollapsibleSection
              title={`Amazon Fees (${feeSourceLabel})`}
              icon={<DollarSign className="w-4 h-4" />}
              total={formatCurrency(-data.amazonFees)}
              totalColor="text-red-600"
            >
              {/* Core fees */}
              <MetricRow
                label={hasRealFeeBreakdown ? "FBA Fulfillment" : "FBA Fulfillment (~55%)"}
                value={formatCurrency(-amazonFeesBreakdown.fbaFulfillment)}
                valueColor="text-red-600"
                indent
              />
              <MetricRow
                label={hasRealFeeBreakdown ? "Referral Fee" : "Referral Fee (~35%)"}
                value={formatCurrency(-amazonFeesBreakdown.referralFee)}
                valueColor="text-red-600"
                indent
              />
              <MetricRow
                label={hasRealFeeBreakdown ? "Storage Fee" : "Storage Fee (~5%)"}
                value={formatCurrency(-amazonFeesBreakdown.storageFee)}
                valueColor="text-red-600"
                indent
              />
              <MetricRow
                label={hasRealFeeBreakdown ? "Inbound Fee" : "Inbound Fee (~3%)"}
                value={formatCurrency(-amazonFeesBreakdown.inboundFee)}
                valueColor="text-red-600"
                indent
              />

              {/* Additional fees (only shown when real data available) */}
              {hasRealFeeBreakdown && amazonFeesBreakdown.removalFee > 0 && (
                <MetricRow label="Removal Fee" value={formatCurrency(-amazonFeesBreakdown.removalFee)} valueColor="text-red-600" indent />
              )}
              {hasRealFeeBreakdown && amazonFeesBreakdown.returnsFee > 0 && (
                <MetricRow label="Return Processing" value={formatCurrency(-amazonFeesBreakdown.returnsFee)} valueColor="text-red-600" indent />
              )}
              {hasRealFeeBreakdown && amazonFeesBreakdown.chargebacksFee > 0 && (
                <MetricRow label="Chargebacks" value={formatCurrency(-amazonFeesBreakdown.chargebacksFee)} valueColor="text-red-600" indent />
              )}
              {hasRealFeeBreakdown && amazonFeesBreakdown.otherFee > 0 && (
                <MetricRow label="Other Fees" value={formatCurrency(-amazonFeesBreakdown.otherFee)} valueColor="text-red-600" indent />
              )}

              {/* Reimbursements (positive, reduces total fees) */}
              {hasRealFeeBreakdown && amazonFeesBreakdown.reimbursements > 0 && (
                <MetricRow label="Reimbursements" value={formatCurrency(amazonFeesBreakdown.reimbursements)} valueColor="text-green-600" indent />
              )}

              {/* Fee source note */}
              <p className="text-xs text-gray-400 mt-2 pl-4">
                {hasRealFeeBreakdown
                  ? '✓ Real fee data from Amazon Finances API'
                  : '* Total fee is from Amazon. Breakdown is estimated.'}
              </p>
            </CollapsibleSection>

            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-gray-500">↩️</span>
                <span className="font-medium text-gray-900">Refunds</span>
              </div>
              <span className="font-semibold text-red-600">{formatCurrency(-data.refunds)}</span>
            </div>

            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-gray-500">📦</span>
                <span className="font-medium text-gray-900">COGS</span>
              </div>
              <span className="font-semibold text-red-600">{formatCurrency(-data.cogs)}</span>
            </div>
          </div>

          {/* Profit Section */}
          <div className="px-2 py-4 border-b border-gray-200">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Profit</h3>

            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-gray-500">💰</span>
                <span className="font-medium text-gray-900">Gross Profit</span>
              </div>
              <span className={`font-semibold ${data.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(data.grossProfit)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-emerald-50 to-transparent rounded-lg mx-2">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-emerald-600">⭐</span>
                <span className="font-bold text-gray-900">Net Profit</span>
              </div>
              <span className={`text-xl font-bold ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(data.netProfit)}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span className="text-gray-500">🏦</span>
                <span className="font-medium text-gray-900">Est. Payout</span>
              </div>
              <span className="font-semibold text-blue-600">{formatCurrency(estPayout)}</span>
            </div>
          </div>

          {/* Performance Metrics Section */}
          <div className="px-2 py-4">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Performance Metrics</h3>

            <div className="grid grid-cols-2 gap-4 px-4">
              {/* Real ACOS - Requires Advertising API (Coming Soon) */}
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200/50">
                <p className="text-xs text-gray-400 mb-1">Real ACOS</p>
                <p className="text-lg font-semibold text-amber-600">
                  0.0% <span className="text-xs font-normal">(Coming Soon)</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Refund Rate</p>
                <p className={`text-xl font-bold ${refundRate > 5 ? 'text-red-600' : refundRate > 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatPercent(refundRate)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Margin</p>
                <p className={`text-xl font-bold ${margin > 20 ? 'text-emerald-600' : margin > 10 ? 'text-amber-600' : 'text-red-600'}`}>
                  {formatPercent(margin)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">ROI</p>
                <p className={`text-xl font-bold ${roi > 50 ? 'text-emerald-600' : roi > 20 ? 'text-amber-600' : 'text-red-600'}`}>
                  {formatPercent(roi)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
