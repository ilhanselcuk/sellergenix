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

  // Mock breakdown data (in real app, this comes from API)
  const salesBreakdown = {
    organic: data.sales * 0.65,
    sponsoredProducts: data.sales * 0.25,
    sponsoredDisplay: data.sales * 0.10,
  }

  const unitsBreakdown = {
    organic: Math.floor(data.units * 0.65),
    spUnits: Math.floor(data.units * 0.25),
    sdUnits: Math.floor(data.units * 0.10),
  }

  const adSpendBreakdown = {
    sponsoredProducts: data.adSpend * 0.55,
    sponsoredBrands: data.adSpend * 0.20,
    sponsoredDisplay: data.adSpend * 0.15,
    sbVideo: data.adSpend * 0.10,
  }

  const amazonFeesBreakdown = {
    fbaFulfillment: data.amazonFees * 0.55,
    referralFee: data.amazonFees * 0.35,
    storageFee: data.amazonFees * 0.07,
    inboundFee: data.amazonFees * 0.03,
  }

  const margin = data.sales > 0 ? (data.netProfit / data.sales) * 100 : 0
  const roi = (data.cogs + data.adSpend) > 0 ? (data.netProfit / (data.cogs + data.adSpend)) * 100 : 0
  const realAcos = data.sales > 0 ? (data.adSpend / data.sales) * 100 : 0
  const refundRate = data.units > 0 ? (data.refunds / data.units) * 100 : 0
  const estPayout = data.sales - data.amazonFees - data.refunds

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

            <CollapsibleSection
              title="Sales"
              icon={<DollarSign className="w-4 h-4" />}
              total={formatCurrency(data.sales)}
              totalColor="text-emerald-600"
              defaultOpen={true}
            >
              <MetricRow label="Organic" value={formatCurrency(salesBreakdown.organic)} indent />
              <MetricRow label="Sponsored Products" value={formatCurrency(salesBreakdown.sponsoredProducts)} indent />
              <MetricRow label="Sponsored Display" value={formatCurrency(salesBreakdown.sponsoredDisplay)} indent />
            </CollapsibleSection>

            <CollapsibleSection
              title="Units"
              icon={<Package className="w-4 h-4" />}
              total={data.units.toLocaleString()}
            >
              <MetricRow label="Organic" value={unitsBreakdown.organic.toLocaleString()} indent />
              <MetricRow label="SP Units" value={unitsBreakdown.spUnits.toLocaleString()} indent />
              <MetricRow label="SD Units" value={unitsBreakdown.sdUnits.toLocaleString()} indent />
            </CollapsibleSection>

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

            <CollapsibleSection
              title="Ad Spend"
              icon={<BarChart3 className="w-4 h-4" />}
              total={formatCurrency(-data.adSpend)}
              totalColor="text-red-600"
            >
              <MetricRow label="Sponsored Products" value={formatCurrency(-adSpendBreakdown.sponsoredProducts)} valueColor="text-red-600" indent />
              <MetricRow label="Sponsored Brands" value={formatCurrency(-adSpendBreakdown.sponsoredBrands)} valueColor="text-red-600" indent />
              <MetricRow label="Sponsored Display" value={formatCurrency(-adSpendBreakdown.sponsoredDisplay)} valueColor="text-red-600" indent />
              <MetricRow label="SB Video" value={formatCurrency(-adSpendBreakdown.sbVideo)} valueColor="text-red-600" indent />
            </CollapsibleSection>

            <CollapsibleSection
              title="Amazon Fees"
              icon={<DollarSign className="w-4 h-4" />}
              total={formatCurrency(-data.amazonFees)}
              totalColor="text-red-600"
            >
              <MetricRow label="FBA Fulfillment" value={formatCurrency(-amazonFeesBreakdown.fbaFulfillment)} valueColor="text-red-600" indent />
              <MetricRow label="Referral Fee" value={formatCurrency(-amazonFeesBreakdown.referralFee)} valueColor="text-red-600" indent />
              <MetricRow label="Storage Fee" value={formatCurrency(-amazonFeesBreakdown.storageFee)} valueColor="text-red-600" indent />
              <MetricRow label="Inbound Fee" value={formatCurrency(-amazonFeesBreakdown.inboundFee)} valueColor="text-red-600" indent />
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
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Real ACOS</p>
                <p className={`text-xl font-bold ${realAcos > 30 ? 'text-red-600' : realAcos > 20 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatPercent(realAcos)}
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
