'use client'

import React, { useState } from 'react'
import { X, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import { PeriodData } from './PeriodCard'

interface DetailedBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  data: PeriodData | null
}

// Collapsible section component - Sellerboard style
function CollapsibleRow({
  label,
  value,
  valueColor = 'text-gray-900',
  children,
  defaultOpen = false,
  hasWarning = false,
  isBold = false,
}: {
  label: string
  value: string
  valueColor?: string
  children?: React.ReactNode
  defaultOpen?: boolean
  hasWarning?: boolean
  isBold?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const hasChildren = React.Children.count(children) > 0

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between py-2.5 px-4 ${hasChildren ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'} transition-colors`}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )
          ) : (
            <span className="w-4" />
          )}
          <span className={`${isBold ? 'font-semibold' : 'font-medium'} text-gray-900`}>{label}</span>
          {hasWarning && <AlertCircle className="w-4 h-4 text-amber-500" />}
        </div>
        <span className={`${isBold ? 'font-bold' : 'font-semibold'} ${valueColor}`}>{value}</span>
      </button>
      {isOpen && hasChildren && (
        <div className="pb-2">
          {children}
        </div>
      )}
    </div>
  )
}

// Sub-item row (indented)
function SubRow({
  label,
  value,
  valueColor = 'text-gray-700',
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-4 pl-10">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
    </div>
  )
}

// Divider
function Divider() {
  return <div className="h-px bg-gray-200 my-2" />
}

export default function DetailedBreakdownModal({ isOpen, onClose, data }: DetailedBreakdownModalProps) {
  if (!isOpen || !data) return null

  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    })
    return value < 0 ? `-${formatted}` : formatted
  }

  const formatPercent = (value: number) => `${value.toFixed(2)}%`

  // Safe values
  const safeRefunds = data.refunds ?? 0
  const safeCogs = data.cogs ?? 0
  const safeAdSpend = data.adSpend ?? 0

  // Amazon Fees breakdown - use real data when available
  const hasRealFees = (data.feeSource === 'real' || data.feeSource === 'mixed') && data.feeBreakdown

  const fees = hasRealFees
    ? {
        fbaFulfillment: data.feeBreakdown!.fbaFulfillment || 0,
        referral: data.feeBreakdown!.referral || 0,
        storage: data.feeBreakdown!.storage || 0,
        inbound: data.feeBreakdown!.inbound || 0,
        removal: data.feeBreakdown!.removal || 0,
        returns: data.feeBreakdown!.returns || 0,
        chargebacks: data.feeBreakdown!.chargebacks || 0,
        other: data.feeBreakdown!.other || 0,
        reimbursements: data.feeBreakdown!.reimbursements || 0,
      }
    : null

  // Calculated metrics
  const grossProfit = data.grossProfit ?? (data.sales - data.amazonFees - safeRefunds - safeCogs)
  const netProfit = data.netProfit ?? (grossProfit - safeAdSpend)
  const margin = data.sales > 0 ? (netProfit / data.sales) * 100 : 0
  const roi = safeCogs > 0 ? (netProfit / safeCogs) * 100 : 0
  const refundRate = data.units > 0 ? (safeRefunds / data.units) * 100 : 0
  const realAcos = data.sales > 0 ? (safeAdSpend / data.sales) * 100 : 0
  const estPayout = data.sales - data.amazonFees - safeRefunds

  // Format date range
  const formatDateRange = () => {
    const startStr = data.startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    const endStr = data.endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    if (startStr === endStr) return startStr
    return `${data.startDate.toLocaleDateString('en-US', { day: 'numeric' })}-${endStr.replace(',', '')}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Left accent border */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-500 rounded-l-2xl" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{data.label}</h2>
            <p className="text-sm text-gray-500">{formatDateRange()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Sales - Expandable */}
          <CollapsibleRow
            label="Sales"
            value={formatCurrency(data.sales)}
            valueColor="text-gray-900"
            defaultOpen={false}
          >
            <SubRow label="Organic" value={formatCurrency(data.sales)} />
            <SubRow label="Sponsored Products (same day)" value="$0.00" valueColor="text-gray-400" />
            <SubRow label="Sponsored Display (same day)" value="$0.00" valueColor="text-gray-400" />
          </CollapsibleRow>

          {/* Units - Expandable */}
          <CollapsibleRow
            label="Units"
            value={data.units.toLocaleString()}
            defaultOpen={false}
          >
            <SubRow label="Organic" value={data.units.toLocaleString()} />
            <SubRow label="Sponsored Products (same day)" value="0" valueColor="text-gray-400" />
            <SubRow label="Sponsored Display (same day)" value="0" valueColor="text-gray-400" />
          </CollapsibleRow>

          {/* Promo */}
          <CollapsibleRow label="Promo" value="$0.00" valueColor="text-gray-500" />

          {/* Advertising cost - Expandable */}
          <CollapsibleRow
            label="Advertising cost"
            value={formatCurrency(-safeAdSpend)}
            valueColor={safeAdSpend > 0 ? "text-red-600" : "text-gray-500"}
            defaultOpen={false}
          >
            <SubRow label="Sponsored Products" value={formatCurrency(-safeAdSpend)} valueColor="text-red-600" />
            <SubRow label="Sponsored Brands Video" value="$0.00" valueColor="text-gray-400" />
            <SubRow label="Sponsored Display" value="$0.00" valueColor="text-gray-400" />
            <SubRow label="Sponsored Brands" value="$0.00" valueColor="text-gray-400" />
          </CollapsibleRow>

          {/* Refund cost - Expandable */}
          <CollapsibleRow
            label="Refund cost"
            value={formatCurrency(-safeRefunds)}
            valueColor={safeRefunds > 0 ? "text-red-600" : "text-gray-500"}
            defaultOpen={false}
          >
            <SubRow label="Refunded amount" value={formatCurrency(-safeRefunds)} valueColor="text-red-600" />
            <SubRow label="Refund commission" value="$0.00" valueColor="text-gray-400" />
            <SubRow label="Refunded referral fee" value="$0.00" valueColor="text-gray-400" />
          </CollapsibleRow>

          {/* Amazon fees - Expandable (DETAILED) */}
          <CollapsibleRow
            label="Amazon fees"
            value={formatCurrency(-data.amazonFees)}
            valueColor="text-red-600"
            defaultOpen={true}
          >
            {hasRealFees && fees ? (
              <>
                {fees.fbaFulfillment > 0 && (
                  <SubRow label="FBA per unit fulfilment fee" value={formatCurrency(-fees.fbaFulfillment)} valueColor="text-red-600" />
                )}
                {fees.referral > 0 && (
                  <SubRow label="Referral fee" value={formatCurrency(-fees.referral)} valueColor="text-red-600" />
                )}
                {fees.storage > 0 && (
                  <SubRow label="FBA storage fee" value={formatCurrency(-fees.storage)} valueColor="text-red-600" />
                )}
                {fees.inbound > 0 && (
                  <SubRow label="Inbound transportation" value={formatCurrency(-fees.inbound)} valueColor="text-red-600" />
                )}
                {fees.removal > 0 && (
                  <SubRow label="FBA removal fee" value={formatCurrency(-fees.removal)} valueColor="text-red-600" />
                )}
                {fees.returns > 0 && (
                  <SubRow label="FBA customer return per unit fee" value={formatCurrency(-fees.returns)} valueColor="text-red-600" />
                )}
                {fees.chargebacks > 0 && (
                  <SubRow label="Chargebacks" value={formatCurrency(-fees.chargebacks)} valueColor="text-red-600" />
                )}
                {fees.other > 0 && (
                  <SubRow label="Other fees" value={formatCurrency(-fees.other)} valueColor="text-red-600" />
                )}
                {fees.reimbursements > 0 && (
                  <SubRow label="Reversal reimbursement" value={formatCurrency(fees.reimbursements)} valueColor="text-green-600" />
                )}
                {/* Show message if all fees are 0 */}
                {fees.fbaFulfillment === 0 && fees.referral === 0 && (
                  <div className="px-10 py-2 text-xs text-gray-400">
                    No fee details available yet
                  </div>
                )}
              </>
            ) : (
              <>
                <SubRow label="FBA per unit fulfilment fee" value={formatCurrency(-data.amazonFees * 0.55)} valueColor="text-red-600" />
                <SubRow label="Referral fee" value={formatCurrency(-data.amazonFees * 0.35)} valueColor="text-red-600" />
                <SubRow label="FBA storage fee" value={formatCurrency(-data.amazonFees * 0.05)} valueColor="text-red-600" />
                <SubRow label="Other fees" value={formatCurrency(-data.amazonFees * 0.05)} valueColor="text-red-600" />
                <div className="px-10 py-2 text-xs text-amber-500 italic">
                  Estimated breakdown • Real fees syncing...
                </div>
              </>
            )}
          </CollapsibleRow>

          <Divider />

          {/* Cost of goods */}
          <CollapsibleRow
            label="Cost of goods"
            value={formatCurrency(-safeCogs)}
            valueColor={safeCogs > 0 ? "text-red-600" : "text-gray-500"}
            hasWarning={safeCogs === 0}
          />

          {/* Gross profit */}
          <CollapsibleRow
            label="Gross profit"
            value={formatCurrency(grossProfit)}
            valueColor={grossProfit >= 0 ? "text-gray-900" : "text-red-600"}
            hasWarning={grossProfit < 0}
          />

          {/* Indirect expenses */}
          <CollapsibleRow
            label="Indirect expenses"
            value="$0.00"
            valueColor="text-gray-500"
          />

          {/* Net profit - BOLD */}
          <CollapsibleRow
            label="Net profit"
            value={formatCurrency(netProfit)}
            valueColor={netProfit >= 0 ? "text-green-600" : "text-red-600"}
            isBold
            hasWarning={netProfit < 0}
          />

          {/* Estimated payout */}
          <CollapsibleRow
            label="Estimated payout"
            value={formatCurrency(estPayout)}
            valueColor="text-gray-900"
          />

          <Divider />

          {/* Metrics Section */}
          <CollapsibleRow
            label="Real ACOS"
            value={formatPercent(realAcos)}
            valueColor="text-gray-900"
          />

          <CollapsibleRow
            label="% Refunds"
            value={formatPercent(refundRate)}
            valueColor={refundRate > 10 ? "text-red-600" : "text-gray-900"}
          />

          <CollapsibleRow
            label="Sellable returns"
            value="0.00%"
            valueColor="text-gray-500"
          />

          <CollapsibleRow
            label="Margin"
            value={formatPercent(margin)}
            valueColor={margin >= 0 ? "text-gray-900" : "text-red-600"}
          />

          <CollapsibleRow
            label="ROI"
            value={formatPercent(roi)}
            valueColor="text-gray-900"
          />

          <Divider />

          {/* Additional Metrics */}
          <CollapsibleRow
            label="Active subscriptions (SnS)"
            value="0"
            valueColor="text-gray-500"
          />

          <CollapsibleRow
            label="Sessions"
            value="-"
            valueColor="text-gray-400"
            defaultOpen={false}
          >
            <SubRow label="Browser sessions" value="-" valueColor="text-gray-400" />
            <SubRow label="Mobile app sessions" value="-" valueColor="text-gray-400" />
          </CollapsibleRow>

          <CollapsibleRow
            label="Unit session percentage"
            value="-"
            valueColor="text-gray-400"
          />

          {/* Bottom padding */}
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
