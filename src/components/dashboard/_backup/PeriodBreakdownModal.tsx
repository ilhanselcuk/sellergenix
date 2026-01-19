'use client'

/**
 * Period Breakdown Modal
 * Detailed product-level breakdown when user clicks on a profit card
 * Based on Sellerboard's detailed view pattern
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Minus, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { FEE_EXPLANATIONS } from '@/lib/amazon-fees'

interface Product {
  asin: string
  name: string
  imageUrl?: string
  unitsSold: number
  orders: number
  refunds: number
  sales: number
  adSpend: number
  sellableReturns: number
  grossProfit: number
  netProfit: number
  margin: number
  roi: number
  bsr?: number
}

interface BreakdownData {
  period: string
  sales: number
  units: number
  orders: number

  // Revenue deductions
  promo: number

  // Amazon fees (detailed breakdown)
  referralFee: number
  closingFee: number
  fbaFulfillmentFee: number
  monthlyStorageFee: number
  longTermStorageFee: number
  inboundPlacementFee: number
  removalFee: number
  refundAdminFee: number
  returnsProcessingFee: number

  // Total Amazon fees (calculated)
  amazonFees: number

  // Advertising
  adCost: number

  // Costs
  cogs: number
  refundCost: number

  // Profit calculations
  grossProfit: number
  indirectExpenses: number
  netProfit: number
  estimatedPayout: number

  // Metrics
  realAcos: number
  refundsPercent: number
  sellableReturns: number
  margin: number
  roi: number
  sessions?: number
  unitSessionPercentage?: number

  products: Product[]
}

interface PeriodBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  data: BreakdownData
}

export function PeriodBreakdownModal({ isOpen, onClose, data }: PeriodBreakdownModalProps) {
  // Info popup state management
  const [showingInfo, setShowingInfo] = useState<{ id: string; label: string } | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number; placement: 'right' | 'left' }>({
    top: 0,
    left: 0,
    placement: 'right'
  })
  const infoButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Expandable product rows state
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  const toggleProductExpand = (asin: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(asin)) {
        newSet.delete(asin)
      } else {
        newSet.add(asin)
      }
      return newSet
    })
  }

  // Dynamic popup positioning to avoid viewport overflow
  useEffect(() => {
    if (showingInfo && infoButtonRefs.current[showingInfo.id]) {
      const button = infoButtonRefs.current[showingInfo.id]
      if (!button) return

      const rect = button.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const popupWidth = 380
      const gap = 12

      let left = rect.right + gap
      let placement: 'right' | 'left' = 'right'

      // If popup overflows right edge, show on left
      if (left + popupWidth > viewportWidth - 20) {
        left = rect.left - popupWidth - gap
        placement = 'left'
      }

      // Ensure popup stays within left boundary
      if (left < 20) {
        left = 20
      }

      // Center popup vertically relative to button, but keep within viewport
      let top = rect.top + (rect.height / 2) - 150 // Approximate popup height / 2
      top = Math.max(20, Math.min(top, window.innerHeight - 320))

      setPopupPosition({ top, left, placement })
    }
  }, [showingInfo])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showingInfo) {
          setShowingInfo(null)
        } else {
          onClose()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, showingInfo])

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-6xl pointer-events-auto my-8"
            >
              {/* Premium Gradient Border Container */}
              <div className="bg-gradient-to-br from-purple-600 via-[#4285f4] to-[#34a853] rounded-2xl p-px shadow-2xl">
                <div className="bg-white dark:bg-gray-900 rounded-xl"
              >
              {/* Header - Premium Gradient */}
              <div className="flex items-center justify-between p-6 border-b border-purple-200/30">
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-[#4285f4] to-[#34a853] bg-clip-text text-transparent">
                    {data.period}
                  </h2>
                  <p className="text-sm text-[#6c757d] mt-1">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 transition-all duration-300 group"
                >
                  <X className="w-6 h-6 text-[#6c757d] group-hover:text-purple-600 transition-colors" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">

                {/* Summary Metrics - Premium Gradient Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {/* Sales Card */}
                  <div className="bg-gradient-to-br from-[#4285f4] via-[#1a73e8] to-[#0d47a1] rounded-2xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <p className="text-xs font-semibold text-[#6c757d] mb-1">Sales</p>
                      <p className="text-2xl font-black text-[#343a40]">
                        ${data.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  {/* Units/Orders Card */}
                  <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 rounded-2xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <p className="text-xs font-semibold text-[#6c757d] mb-1">Units / Orders</p>
                      <p className="text-2xl font-black text-[#343a40]">
                        {data.units} / {data.orders}
                      </p>
                    </div>
                  </div>
                  {/* Net Profit Card */}
                  <div className="bg-gradient-to-br from-[#34a853] via-[#2e7d32] to-[#1b5e20] rounded-2xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <p className="text-xs font-semibold text-[#6c757d] mb-1">Net Profit</p>
                      <p className="text-2xl font-black text-[#34a853]">
                        ${data.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  {/* Margin Card */}
                  <div className="bg-gradient-to-br from-[#00bcd4] via-[#0097a7] to-[#006064] rounded-2xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <p className="text-xs font-semibold text-[#6c757d] mb-1">Margin</p>
                      <p className="text-2xl font-black text-[#343a40]">
                        {data.margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Comprehensive Financial Breakdown */}
                <div className="mb-8">
                  <h3 className="text-lg font-black bg-gradient-to-r from-purple-600 to-[#4285f4] bg-clip-text text-transparent mb-6">
                    Comprehensive Financial Breakdown
                  </h3>

                  {/* Revenue Section - Premium Card */}
                  <div className="bg-gradient-to-br from-[#34a853] via-[#2e7d32] to-[#1b5e20] rounded-2xl p-px shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                    <div className="mb-4">
                    <h4 className="text-sm font-bold text-[#6c757d] uppercase mb-3 flex items-center gap-2">
                      Revenue
                      <div className="flex-1 h-px bg-[#e5e7eb]" />
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#34a853]/5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#343a40]">Total Sales</span>
                          <button
                            ref={(el) => { infoButtonRefs.current['sales'] = el }}
                            onClick={() => setShowingInfo(showingInfo?.id === 'sales' ? null : { id: 'sales', label: 'Total Sales' })}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                            type="button"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                          </button>
                        </div>
                        <span className="font-black text-[#34a853]">
                          ${data.sales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    </div>
                    </div>
                  </div>

                  {/* Deductions Section - Premium Card */}
                  <div className="bg-gradient-to-br from-[#fbbc05] via-[#f9a825] to-[#f57c00] rounded-2xl p-px shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                    <div className="mb-4">
                    <h4 className="text-sm font-bold text-[#6c757d] uppercase mb-3 flex items-center gap-2">
                      Deductions from Revenue
                      <div className="flex-1 h-px bg-[#e5e7eb]" />
                    </h4>
                    <div className="space-y-2">
                      {/* Promo */}
                      {data.promo > 0 && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#6c757d]">Promotional Rebates</span>
                            <button
                              ref={(el) => { infoButtonRefs.current['promotionalRebates'] = el }}
                              onClick={() => setShowingInfo(showingInfo?.id === 'promotionalRebates' ? null : { id: 'promotionalRebates', label: 'Promotional Rebates' })}
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                              type="button"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                            </button>
                          </div>
                          <span className="font-black text-[#ea4335]">
                            -${Math.abs(data.promo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                    </div>
                    </div>
                  </div>

                  {/* Amazon Fees Section - Premium Card */}
                  <div className="bg-gradient-to-br from-[#ea4335] via-[#d32f2f] to-[#c62828] rounded-2xl p-px shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                    <div className="mb-4">
                    <h4 className="text-sm font-bold text-[#6c757d] uppercase mb-3 flex items-center gap-2">
                      Amazon Fees
                      <div className="flex-1 h-px bg-[#e5e7eb]" />
                    </h4>
                    <div className="space-y-2">
                      {/* Referral Fee */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#6c757d]">Referral Fee</span>
                          <button
                            ref={(el) => { infoButtonRefs.current['referralFee'] = el }}
                            onClick={() => setShowingInfo(showingInfo?.id === 'referralFee' ? null : { id: 'referralFee', label: 'Referral Fee' })}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                            type="button"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                          </button>
                        </div>
                        <span className="font-black text-[#ea4335]">
                          -${Math.abs(data.referralFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Closing Fee */}
                      {data.closingFee > 0 && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#6c757d]">Closing Fee (Media)</span>
                            <button
                              ref={(el) => { infoButtonRefs.current['closingFee'] = el }}
                              onClick={() => setShowingInfo(showingInfo?.id === 'closingFee' ? null : { id: 'closingFee', label: 'Closing Fee' })}
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                              type="button"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                            </button>
                          </div>
                          <span className="font-black text-[#ea4335]">
                            -${Math.abs(data.closingFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {/* FBA Fulfillment Fee */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#6c757d]">FBA Fulfillment Fee</span>
                          <button
                            ref={(el) => { infoButtonRefs.current['fbaFulfillmentFee'] = el }}
                            onClick={() => setShowingInfo(showingInfo?.id === 'fbaFulfillmentFee' ? null : { id: 'fbaFulfillmentFee', label: 'FBA Fulfillment Fee' })}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                            type="button"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                          </button>
                        </div>
                        <span className="font-black text-[#ea4335]">
                          -${Math.abs(data.fbaFulfillmentFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Monthly Storage Fee */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#6c757d]">Monthly Storage Fee</span>
                          <button
                            ref={(el) => { infoButtonRefs.current['monthlyStorageFee'] = el }}
                            onClick={() => setShowingInfo(showingInfo?.id === 'monthlyStorageFee' ? null : { id: 'monthlyStorageFee', label: 'Monthly Storage Fee' })}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                            type="button"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                          </button>
                        </div>
                        <span className="font-black text-[#ea4335]">
                          -${Math.abs(data.monthlyStorageFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Long-term Storage Fee */}
                      {data.longTermStorageFee > 0 && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#6c757d]">Long-Term Storage Fee</span>
                            <button
                              ref={(el) => { infoButtonRefs.current['longTermStorageFee'] = el }}
                              onClick={() => setShowingInfo(showingInfo?.id === 'longTermStorageFee' ? null : { id: 'longTermStorageFee', label: 'Long-Term Storage Fee' })}
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                              type="button"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                            </button>
                          </div>
                          <span className="font-black text-[#ea4335]">
                            -${Math.abs(data.longTermStorageFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {/* Inbound Placement Fee */}
                      {data.inboundPlacementFee > 0 && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#6c757d]">Inbound Placement Fee</span>
                            <button
                              ref={(el) => { infoButtonRefs.current['inboundPlacementFee'] = el }}
                              onClick={() => setShowingInfo(showingInfo?.id === 'inboundPlacementFee' ? null : { id: 'inboundPlacementFee', label: 'Inbound Placement Fee' })}
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                              type="button"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                            </button>
                          </div>
                          <span className="font-black text-[#ea4335]">
                            -${Math.abs(data.inboundPlacementFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {/* Refund Admin Fee */}
                      {data.refundAdminFee > 0 && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#6c757d]">Refund Admin Fee</span>
                            <button
                              ref={(el) => { infoButtonRefs.current['refundAdminFee'] = el }}
                              onClick={() => setShowingInfo(showingInfo?.id === 'refundAdminFee' ? null : { id: 'refundAdminFee', label: 'Refund Admin Fee' })}
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                              type="button"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                            </button>
                          </div>
                          <span className="font-black text-[#ea4335]">
                            -${Math.abs(data.refundAdminFee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {/* Total Amazon Fees */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#ea4335]/10 border border-[#ea4335]/20 mt-3">
                        <span className="font-bold text-[#343a40]">Total Amazon Fees</span>
                        <span className="font-black text-[#ea4335]">
                          -${Math.abs(data.amazonFees).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    </div>
                    </div>
                  </div>

                  {/* Other Costs Section - Premium Card */}
                  <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 rounded-2xl p-px shadow-lg hover:shadow-xl transition-all duration-300 mb-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                    <div className="mb-4">
                    <h4 className="text-sm font-bold text-[#6c757d] uppercase mb-3 flex items-center gap-2">
                      Other Costs
                      <div className="flex-1 h-px bg-[#e5e7eb]" />
                    </h4>
                    <div className="space-y-2">
                      {/* COGS */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#6c757d]">Cost of Goods Sold</span>
                          <button
                            ref={(el) => { infoButtonRefs.current['cogs'] = el }}
                            onClick={() => setShowingInfo(showingInfo?.id === 'cogs' ? null : { id: 'cogs', label: 'Cost of Goods Sold' })}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                            type="button"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                          </button>
                        </div>
                        <span className="font-black text-[#ea4335]">
                          -${Math.abs(data.cogs).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Advertising */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#6c757d]">Advertising Spend</span>
                          <button
                            ref={(el) => { infoButtonRefs.current['advertisingCost'] = el }}
                            onClick={() => setShowingInfo(showingInfo?.id === 'advertisingCost' ? null : { id: 'advertisingCost', label: 'Advertising Spend' })}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                            type="button"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                          </button>
                        </div>
                        <span className="font-black text-[#ea4335]">
                          -${Math.abs(data.adCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Refund Cost */}
                      {data.refundCost > 0 && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#6c757d]">Refund Cost</span>
                            <button
                              ref={(el) => { infoButtonRefs.current['refundCost'] = el }}
                              onClick={() => setShowingInfo(showingInfo?.id === 'refundCost' ? null : { id: 'refundCost', label: 'Refund Cost' })}
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                              type="button"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                            </button>
                          </div>
                          <span className="font-black text-[#ea4335]">
                            -${Math.abs(data.refundCost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {/* Indirect Expenses */}
                      {data.indirectExpenses > 0 && (
                        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#f8f9fa]">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#6c757d]">Indirect Expenses</span>
                            <button
                              ref={(el) => { infoButtonRefs.current['indirectExpenses'] = el }}
                              onClick={() => setShowingInfo(showingInfo?.id === 'indirectExpenses' ? null : { id: 'indirectExpenses', label: 'Indirect Expenses' })}
                              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                              type="button"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                            </button>
                          </div>
                          <span className="font-black text-[#ea4335]">
                            -${Math.abs(data.indirectExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                    </div>
                    </div>
                  </div>

                  {/* Profit Summary Section - Premium Card */}
                  <div className="bg-gradient-to-br from-[#34a853] via-[#2e7d32] to-[#1b5e20] rounded-2xl p-px shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                    <div>
                    <h4 className="text-sm font-bold text-[#6c757d] uppercase mb-3 flex items-center gap-2">
                      Profit Summary
                      <div className="flex-1 h-px bg-[#e5e7eb]" />
                    </h4>
                    <div className="space-y-2">
                      {/* Gross Profit */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#34a853]/5 border border-[#34a853]/20">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#343a40]">Gross Profit</span>
                          <button
                            ref={(el) => { infoButtonRefs.current['grossProfit'] = el }}
                            onClick={() => setShowingInfo(showingInfo?.id === 'grossProfit' ? null : { id: 'grossProfit', label: 'Gross Profit' })}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                            type="button"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                          </button>
                        </div>
                        <span className="font-black text-[#34a853]">
                          ${data.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Net Profit */}
                      <div className="flex items-center justify-between py-4 px-4 rounded-xl bg-[#34a853]/10 border border-[#34a853]/30">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#343a40]">Net Profit</span>
                          <button
                            ref={(el) => { infoButtonRefs.current['netProfit'] = el }}
                            onClick={() => setShowingInfo(showingInfo?.id === 'netProfit' ? null : { id: 'netProfit', label: 'Net Profit' })}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                            type="button"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                          </button>
                        </div>
                        <span className="font-black text-[#34a853] text-xl">
                          ${data.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Estimated Payout */}
                      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-[#4285f4]/5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#343a40]">Estimated Payout</span>
                          <button
                            ref={(el) => { infoButtonRefs.current['estimatedPayout'] = el }}
                            onClick={() => setShowingInfo(showingInfo?.id === 'estimatedPayout' ? null : { id: 'estimatedPayout', label: 'Estimated Payout' })}
                            className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                            type="button"
                          >
                            <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                          </button>
                        </div>
                        <span className="font-black text-[#4285f4]">
                          ${data.estimatedPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics - Premium Cards */}
                <div className="mb-8">
                  <h3 className="text-lg font-black bg-gradient-to-r from-[#4285f4] to-[#34a853] bg-clip-text text-transparent mb-6">
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Real ACOS */}
                    <div className="bg-gradient-to-br from-[#ea4335] via-[#d32f2f] to-[#c62828] rounded-2xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-semibold text-[#6c757d]">Real ACOS</p>
                        <button
                          ref={(el) => { infoButtonRefs.current['realAcos'] = el }}
                          onClick={() => setShowingInfo(showingInfo?.id === 'realAcos' ? null : { id: 'realAcos', label: 'Real ACOS' })}
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                          type="button"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                        </button>
                      </div>
                      <p className="text-xl font-black text-[#343a40]">{data.realAcos.toFixed(2)}%</p>
                      </div>
                    </div>
                    {/* % Refunds */}
                    <div className="bg-gradient-to-br from-[#fbbc05] via-[#f9a825] to-[#f57c00] rounded-2xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-semibold text-[#6c757d]">% Refunds</p>
                        <button
                          ref={(el) => { infoButtonRefs.current['refundsPercent'] = el }}
                          onClick={() => setShowingInfo(showingInfo?.id === 'refundsPercent' ? null : { id: 'refundsPercent', label: '% Refunds' })}
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                          type="button"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                        </button>
                      </div>
                      <p className="text-xl font-black text-[#343a40]">{data.refundsPercent.toFixed(2)}%</p>
                      </div>
                    </div>
                    {/* Sellable Returns */}
                    <div className="bg-gradient-to-br from-[#00bcd4] via-[#0097a7] to-[#006064] rounded-2xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-semibold text-[#6c757d]">Sellable Returns</p>
                        <button
                          ref={(el) => { infoButtonRefs.current['sellableReturns'] = el }}
                          onClick={() => setShowingInfo(showingInfo?.id === 'sellableReturns' ? null : { id: 'sellableReturns', label: 'Sellable Returns' })}
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                          type="button"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                        </button>
                      </div>
                      <p className="text-xl font-black text-[#343a40]">{data.sellableReturns.toFixed(2)}%</p>
                      </div>
                    </div>
                    {/* ROI */}
                    <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 rounded-2xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-semibold text-[#6c757d]">ROI</p>
                        <button
                          ref={(el) => { infoButtonRefs.current['roi'] = el }}
                          onClick={() => setShowingInfo(showingInfo?.id === 'roi' ? null : { id: 'roi', label: 'ROI' })}
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                          type="button"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                        </button>
                      </div>
                      <p className="text-xl font-black text-[#343a40]">{data.roi.toFixed(2)}%</p>
                      </div>
                    </div>
                    {/* Profit Margin */}
                    <div className="bg-gradient-to-br from-[#34a853] via-[#2e7d32] to-[#1b5e20] rounded-2xl p-px shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                      <div className="bg-white dark:bg-gray-900 rounded-xl p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs font-semibold text-[#6c757d]">Profit Margin</p>
                        <button
                          ref={(el) => { infoButtonRefs.current['profitMargin'] = el }}
                          onClick={() => setShowingInfo(showingInfo?.id === 'profitMargin' ? null : { id: 'profitMargin', label: 'Profit Margin' })}
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help group"
                          type="button"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                        </button>
                      </div>
                      <p className="text-xl font-black text-[#343a40]">{data.margin.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Breakdown Table - Premium */}
                <div className="bg-gradient-to-br from-[#4285f4] via-[#1a73e8] to-[#0d47a1] rounded-2xl p-px shadow-lg">
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-6">
                  <h3 className="text-lg font-black bg-gradient-to-r from-[#4285f4] to-purple-600 bg-clip-text text-transparent mb-6">
                    Product Breakdown
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-[#4285f4]/10 to-purple-600/10">
                          <th className="w-10 py-3 px-2"></th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Product</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Units</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Orders</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Refunds</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Sales</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Ads</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Returns</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Gross</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Net</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">Margin</th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">ROI</th>
                          {data.products.some(p => p.bsr) && (
                            <th className="text-right py-3 px-4 text-xs font-bold text-[#6c757d] uppercase">BSR</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {data.products.map((product, index) => {
                          const isExpanded = expandedProducts.has(product.asin)
                          return (
                            <React.Fragment key={product.asin}>
                              <tr className="border-b border-[#e5e7eb] hover:bg-gradient-to-r hover:from-[#4285f4]/5 hover:to-purple-600/5 transition-all duration-300">
                                {/* Expand/Collapse Button */}
                                <td className="py-3 px-2">
                                  <button
                                    onClick={() => toggleProductExpand(product.asin)}
                                    className="p-1 rounded-lg hover:bg-[#4285f4]/10 transition-colors group"
                                    title={isExpanded ? 'Collapse' : 'Expand details'}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-[#6c757d] group-hover:text-[#4285f4] transition-colors" />
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {product.imageUrl && (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-bold text-sm text-[#343a40]">{product.name}</p>
                                  <p className="text-xs text-[#6c757d]">{product.asin}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-[#343a40]">
                              {product.unitsSold}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-[#343a40]">
                              {product.orders}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-[#ea4335]">
                              {product.refunds}
                            </td>
                            <td className="text-right py-3 px-4 font-bold text-[#343a40]">
                              ${product.sales.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-[#ea4335]">
                              ${product.adSpend.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-[#6c757d]">
                              {product.sellableReturns}%
                            </td>
                            <td className="text-right py-3 px-4 font-bold text-[#34a853]">
                              ${product.grossProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right py-3 px-4 font-black text-[#34a853]">
                              ${product.netProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right py-3 px-4 font-semibold">
                              <div className="flex items-center justify-end gap-1">
                                {product.margin > 20 ? (
                                  <TrendingUp className="w-3 h-3 text-[#34a853]" />
                                ) : product.margin < 10 ? (
                                  <TrendingDown className="w-3 h-3 text-[#ea4335]" />
                                ) : (
                                  <Minus className="w-3 h-3 text-[#6c757d]" />
                                )}
                                <span className={
                                  product.margin > 20
                                    ? 'text-[#34a853]'
                                    : product.margin < 10
                                    ? 'text-[#ea4335]'
                                    : 'text-[#343a40]'
                                }>
                                  {product.margin}%
                                </span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 font-semibold text-[#343a40]">
                              {product.roi}%
                            </td>
                            {product.bsr && (
                              <td className="text-right py-3 px-4 font-semibold text-[#4285f4]">
                                {product.bsr.toLocaleString('en-US')}
                              </td>
                            )}
                          </tr>

                          {/* Expanded Detail Row */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <td colSpan={data.products.some(p => p.bsr) ? 13 : 12} className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-gray-800/50 dark:to-gray-800/50">
                                  <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-6 space-y-6">
                                      {/* Product Details Header */}
                                      <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                        {product.imageUrl && (
                                          <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-20 h-20 rounded-lg object-cover shadow-md"
                                          />
                                        )}
                                        <div>
                                          <h4 className="text-lg font-black text-[#343a40] dark:text-gray-100">
                                            {product.name}
                                          </h4>
                                          <p className="text-sm text-[#6c757d] font-mono">ASIN: {product.asin}</p>
                                        </div>
                                      </div>

                                      {/* Detailed Breakdown Grid */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Revenue & Sales Breakdown */}
                                        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                                          <h5 className="text-xs font-bold text-[#6c757d] uppercase mb-4 flex items-center gap-2">
                                            Revenue & Sales
                                            <div className="flex-1 h-px bg-[#e5e7eb]"></div>
                                          </h5>
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Total Sales</span>
                                              <span className="text-sm font-bold text-[#34a853]">
                                                ${product.sales.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Units Sold</span>
                                              <span className="text-sm font-semibold text-[#343a40]">{product.unitsSold}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Orders</span>
                                              <span className="text-sm font-semibold text-[#343a40]">{product.orders}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Avg Price/Unit</span>
                                              <span className="text-sm font-semibold text-[#343a40]">
                                                ${(product.sales / product.unitsSold).toFixed(2)}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Units/Order</span>
                                              <span className="text-sm font-semibold text-[#343a40]">
                                                {(product.unitsSold / product.orders).toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Costs & Fees Breakdown */}
                                        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                                          <h5 className="text-xs font-bold text-[#6c757d] uppercase mb-4 flex items-center gap-2">
                                            Costs & Fees
                                            <div className="flex-1 h-px bg-[#e5e7eb]"></div>
                                          </h5>
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">COGS (est.)</span>
                                              <span className="text-sm font-semibold text-[#ea4335]">
                                                -${(product.sales * 0.30).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Amazon Fees (est.)</span>
                                              <span className="text-sm font-semibold text-[#ea4335]">
                                                -${(product.sales * 0.15 + product.unitsSold * 3.5).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Ad Spend</span>
                                              <span className="text-sm font-semibold text-[#ea4335]">
                                                -${product.adSpend.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Refund Cost</span>
                                              <span className="text-sm font-semibold text-[#ea4335]">
                                                -${(product.refunds * product.sales / product.unitsSold * 0.30).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Performance Metrics */}
                                        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                                          <h5 className="text-xs font-bold text-[#6c757d] uppercase mb-4 flex items-center gap-2">
                                            Performance
                                            <div className="flex-1 h-px bg-[#e5e7eb]"></div>
                                          </h5>
                                          <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Gross Profit</span>
                                              <span className="text-sm font-bold text-[#34a853]">
                                                ${product.grossProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Net Profit</span>
                                              <span className="text-sm font-black text-[#34a853]">
                                                ${product.netProfit.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">Margin</span>
                                              <span className={`text-sm font-bold ${
                                                product.margin > 20 ? 'text-[#34a853]' : product.margin < 10 ? 'text-[#ea4335]' : 'text-[#343a40]'
                                              }`}>
                                                {product.margin}%
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">ROI</span>
                                              <span className="text-sm font-bold text-[#343a40]">{product.roi}%</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs text-[#6c757d]">ACOS (est.)</span>
                                              <span className="text-sm font-semibold text-[#343a40]">
                                                {((product.adSpend / product.sales) * 100).toFixed(1)}%
                                              </span>
                                            </div>
                                            {product.bsr && (
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs text-[#6c757d]">Best Seller Rank</span>
                                                <span className="text-sm font-semibold text-[#4285f4]">
                                                  #{product.bsr.toLocaleString('en-US')}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Additional Stats Row */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <div className="bg-gradient-to-br from-[#ea4335]/10 to-[#d32f2f]/10 rounded-lg p-3">
                                          <p className="text-xs text-[#6c757d] mb-1">Refunds</p>
                                          <p className="text-lg font-black text-[#ea4335]">{product.refunds}</p>
                                          <p className="text-xs text-[#6c757d]">
                                            {((product.refunds / product.unitsSold) * 100).toFixed(1)}% rate
                                          </p>
                                        </div>
                                        <div className="bg-gradient-to-br from-[#00bcd4]/10 to-[#0097a7]/10 rounded-lg p-3">
                                          <p className="text-xs text-[#6c757d] mb-1">Sellable Returns</p>
                                          <p className="text-lg font-black text-[#343a40]">{product.sellableReturns}%</p>
                                          <p className="text-xs text-[#6c757d]">Recovery rate</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-600/10 to-purple-500/10 rounded-lg p-3">
                                          <p className="text-xs text-[#6c757d] mb-1">PPC Sales</p>
                                          <p className="text-lg font-black text-[#343a40]">
                                            ${(product.adSpend * 3.8).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                          </p>
                                          <p className="text-xs text-[#6c757d]">Estimated</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-[#34a853]/10 to-[#2e7d32]/10 rounded-lg p-3">
                                          <p className="text-xs text-[#6c757d] mb-1">ROAS</p>
                                          <p className="text-lg font-black text-[#34a853]">
                                            {((product.adSpend * 3.8) / product.adSpend).toFixed(2)}x
                                          </p>
                                          <p className="text-xs text-[#6c757d]">Return on ad spend</p>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      )
                    })}
                      </tbody>
                    </table>
                  </div>
                  </div>
                </div>
              </div>

              {/* Footer - Premium Buttons */}
              <div className="flex items-center justify-end gap-4 p-6 border-t border-purple-200/30">
                {/* Close Button */}
                <div className="bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 rounded-xl p-px shadow-lg hover:shadow-xl transition-all duration-300">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-white dark:bg-gray-900 rounded-lg font-bold text-[#6c757d] hover:text-[#343a40] transition-colors"
                  >
                    Close
                  </button>
                </div>
                {/* Export CSV Button */}
                <div className="bg-gradient-to-r from-[#4285f4] via-purple-600 to-[#34a853] rounded-xl p-px shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
                  <button className="px-6 py-3 bg-gradient-to-r from-[#4285f4] to-[#34a853] text-white rounded-lg font-bold">
                    Export CSV
                  </button>
                </div>
              </div>
              </div>
            </div>
            </motion.div>
          </div>

          {/* Document-level Info Popup - Fixed positioning to avoid modal clipping */}
          <AnimatePresence>
            {showingInfo && (
              <>
                {/* Backdrop overlay for popup */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowingInfo(null)}
                  className="fixed inset-0 z-[60]"
                  style={{ background: 'transparent' }}
                />

                {/* Popup content */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'fixed',
                    top: `${popupPosition.top}px`,
                    left: `${popupPosition.left}px`,
                    zIndex: 61
                  }}
                  className="pointer-events-auto"
                >
                  <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-purple-200/30 dark:border-purple-800/30 p-6 w-[380px]">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="text-lg font-black bg-gradient-to-r from-purple-600 to-[#4285f4] bg-clip-text text-transparent">
                        {showingInfo.label}
                      </h4>
                      <button
                        onClick={() => setShowingInfo(null)}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <X className="w-4 h-4 text-[#6c757d]" />
                      </button>
                    </div>

                    {/* Description */}
                    {FEE_EXPLANATIONS[showingInfo.id] && (
                      <>
                        <p className="text-sm text-[#343a40] dark:text-gray-300 leading-relaxed mb-4">
                          {FEE_EXPLANATIONS[showingInfo.id].description}
                        </p>

                        {/* Calculation formula */}
                        {FEE_EXPLANATIONS[showingInfo.id].calculation && (
                          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4">
                            <p className="text-xs font-bold text-[#6c757d] uppercase mb-2">
                              Calculation:
                            </p>
                            <code className="text-sm font-mono font-semibold text-[#4285f4] break-words block">
                              {FEE_EXPLANATIONS[showingInfo.id].calculation}
                            </code>
                          </div>
                        )}
                      </>
                    )}

                    {/* Special handling for metrics not in FEE_EXPLANATIONS */}
                    {!FEE_EXPLANATIONS[showingInfo.id] && showingInfo.id === 'refundCost' && (
                      <>
                        <p className="text-sm text-[#343a40] dark:text-gray-300 leading-relaxed mb-4">
                          Cost of products that were refunded to customers. This represents the COGS value of refunded items that you don't recover revenue for.
                        </p>
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4">
                          <p className="text-xs font-bold text-[#6c757d] uppercase mb-2">
                            Calculation:
                          </p>
                          <code className="text-sm font-mono font-semibold text-[#4285f4] break-words block">
                            Refunded Units × COGS per Unit
                          </code>
                        </div>
                      </>
                    )}

                    {!FEE_EXPLANATIONS[showingInfo.id] && showingInfo.id === 'refundsPercent' && (
                      <>
                        <p className="text-sm text-[#343a40] dark:text-gray-300 leading-relaxed mb-4">
                          Percentage of orders that resulted in refunds. Lower is better. Industry average is 2-5%. High refund rates may indicate product quality issues or inaccurate listings.
                        </p>
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4">
                          <p className="text-xs font-bold text-[#6c757d] uppercase mb-2">
                            Calculation:
                          </p>
                          <code className="text-sm font-mono font-semibold text-[#4285f4] break-words block">
                            (Refunded Units ÷ Total Units Sold) × 100
                          </code>
                        </div>
                      </>
                    )}

                    {!FEE_EXPLANATIONS[showingInfo.id] && showingInfo.id === 'sellableReturns' && (
                      <>
                        <p className="text-sm text-[#343a40] dark:text-gray-300 leading-relaxed mb-4">
                          Percentage of returned items that can be resold. Higher is better as you can recover value from these units. FBA automatically determines if returns are sellable based on condition.
                        </p>
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4">
                          <p className="text-xs font-bold text-[#6c757d] uppercase mb-2">
                            Calculation:
                          </p>
                          <code className="text-sm font-mono font-semibold text-[#4285f4] break-words block">
                            (Sellable Returned Units ÷ Total Returned Units) × 100
                          </code>
                        </div>
                      </>
                    )}

                    {/* Arrow indicator */}
                    <div
                      className={`absolute top-6 w-3 h-3 bg-white dark:bg-gray-900 border-t border-l border-purple-200/30 dark:border-purple-800/30 transform rotate-45 ${
                        popupPosition.placement === 'right' ? '-left-1.5' : '-right-1.5'
                      }`}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  )
}
