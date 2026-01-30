'use client'

import React, { useState } from 'react'
import { X, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import { PeriodData } from './PeriodCard'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

interface DetailedBreakdownModalProps {
  isOpen: boolean
  onClose: () => void
  data: PeriodData | null
}

// Helper: Should subscription fee be shown for this period?
// Show for: Weekly+, Monthly, Quarterly, Yearly, Custom
// Hide for: Today, Yesterday, Daily trends
function shouldShowSubscriptionFee(label: string): boolean {
  const lowerLabel = label.toLowerCase()

  // Hide for daily periods
  if (lowerLabel === 'today' || lowerLabel === 'yesterday') return false
  if (lowerLabel.includes('day') && !lowerLabel.includes('week')) return false

  // Show for weekly and longer periods
  if (lowerLabel.includes('week')) return true
  if (lowerLabel.includes('month')) return true
  if (lowerLabel.includes('quarter')) return true
  if (lowerLabel.includes('year')) return true
  if (lowerLabel.includes('custom')) return true

  // Default: show for longer periods, hide for short
  return true
}

// Collapsible section component - Sellerboard style with Starbucks theme
function CollapsibleRow({
  label,
  value,
  valueColor = STARBUCKS.darkGreen,
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
  const [isHovered, setIsHovered] = useState(false)
  const hasChildren = React.Children.count(children) > 0

  return (
    <div style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }} className="last:border-0">
      <button
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-full flex items-center justify-between py-2.5 px-4 transition-colors`}
        style={{
          backgroundColor: isHovered && hasChildren ? STARBUCKS.lightGreen + '40' : 'transparent',
          cursor: hasChildren ? 'pointer' : 'default'
        }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
            ) : (
              <ChevronRight className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
            )
          ) : (
            <span className="w-4" />
          )}
          <span
            className={`${isBold ? 'font-semibold' : 'font-medium'}`}
            style={{ color: STARBUCKS.darkGreen }}
          >
            {label}
          </span>
          {hasWarning && <AlertCircle className="w-4 h-4" style={{ color: STARBUCKS.gold }} />}
        </div>
        <span
          className={`${isBold ? 'font-bold' : 'font-semibold'}`}
          style={{ color: valueColor }}
        >
          {value}
        </span>
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
  valueColor = STARBUCKS.darkGreen + 'CC',
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-4 pl-10">
      <span className="text-sm" style={{ color: STARBUCKS.darkGreen + 'AA' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: valueColor }}>{value}</span>
    </div>
  )
}

// Divider
function Divider() {
  return <div className="h-px my-2" style={{ backgroundColor: STARBUCKS.lightGreen }} />
}

export default function DetailedBreakdownModal({ isOpen, onClose, data }: DetailedBreakdownModalProps) {
  const [closeHovered, setCloseHovered] = useState(false)
  const [buttonHovered, setButtonHovered] = useState(false)

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

  // Amazon Fees breakdown - use real data when available (Sellerboard Parity)
  const hasRealFees = (data.feeSource === 'real' || data.feeSource === 'mixed') && data.feeBreakdown

  const fees = hasRealFees
    ? {
        // === AMAZON FEES (charges) ===
        fbaFulfillment: data.feeBreakdown!.fbaFulfillment || 0,
        mcf: data.feeBreakdown!.mcf || 0,                       // Multi-Channel Fulfillment
        referral: data.feeBreakdown!.referral || 0,
        storage: data.feeBreakdown!.storage || 0,
        longTermStorage: data.feeBreakdown!.longTermStorage || 0,  // Long-term storage (6+ months)
        inbound: data.feeBreakdown!.inbound || 0,
        removal: data.feeBreakdown!.removal || 0,               // Disposal/removal fee
        digitalServices: data.feeBreakdown!.digitalServices || 0,
        refundCommission: data.feeBreakdown!.refundCommission || 0,
        returns: data.feeBreakdown!.returns || 0,
        chargebacks: data.feeBreakdown!.chargebacks || 0,
        other: data.feeBreakdown!.other || 0,
        // === REIMBURSEMENTS (credits - positive values) ===
        warehouseDamage: data.feeBreakdown!.warehouseDamage || 0,
        warehouseLost: data.feeBreakdown!.warehouseLost || 0,
        reversalReimbursement: data.feeBreakdown!.reversalReimbursement || 0,
        refundedReferral: data.feeBreakdown!.refundedReferral || 0,
        // === OTHER ===
        promo: data.feeBreakdown!.promo || 0,
        reimbursements: data.feeBreakdown!.reimbursements || 0, // Legacy
      }
    : null

  // Get promo value (separate from Amazon fees)
  const safePromo = fees?.promo || data.feeBreakdown?.promo || 0

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
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: STARBUCKS.darkGreen + '80' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: STARBUCKS.white }}
      >
        {/* Left accent border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
          style={{ background: `linear-gradient(to bottom, ${STARBUCKS.primaryGreen}, ${STARBUCKS.darkGreen})` }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: STARBUCKS.darkGreen }}>{data.label}</h2>
            <p className="text-sm" style={{ color: STARBUCKS.primaryGreen }}>{formatDateRange()}</p>
          </div>
          <button
            onClick={onClose}
            onMouseEnter={() => setCloseHovered(true)}
            onMouseLeave={() => setCloseHovered(false)}
            className="p-2 rounded-lg transition-colors"
            style={{
              color: closeHovered ? STARBUCKS.darkGreen : STARBUCKS.primaryGreen,
              backgroundColor: closeHovered ? STARBUCKS.lightGreen : 'transparent'
            }}
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
            valueColor={STARBUCKS.darkGreen}
            defaultOpen={false}
          >
            <SubRow label="Organic" value={formatCurrency(data.sales)} />
            <SubRow label="Sponsored Products (same day)" value="$0.00" valueColor={STARBUCKS.darkGreen + '60'} />
            <SubRow label="Sponsored Display (same day)" value="$0.00" valueColor={STARBUCKS.darkGreen + '60'} />
          </CollapsibleRow>

          {/* Units - Expandable */}
          <CollapsibleRow
            label="Units"
            value={data.units.toLocaleString()}
            defaultOpen={false}
          >
            <SubRow label="Organic" value={data.units.toLocaleString()} />
            <SubRow label="Sponsored Products (same day)" value="0" valueColor={STARBUCKS.darkGreen + '60'} />
            <SubRow label="Sponsored Display (same day)" value="0" valueColor={STARBUCKS.darkGreen + '60'} />
          </CollapsibleRow>

          {/* Promo */}
          <CollapsibleRow
            label="Promo"
            value={formatCurrency(-safePromo)}
            valueColor={safePromo > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'}
          />

          {/* Advertising cost - Expandable with SP/SB/SBV/SD breakdown */}
          <CollapsibleRow
            label="Advertising cost"
            value={formatCurrency(-safeAdSpend)}
            valueColor={safeAdSpend > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'}
            defaultOpen={false}
          >
            {/* Use real adsBreakdown if available, otherwise show total in SP */}
            {data.adsBreakdown ? (
              <>
                <SubRow
                  label="Sponsored Products"
                  value={formatCurrency(-data.adsBreakdown.sponsoredProducts)}
                  valueColor={data.adsBreakdown.sponsoredProducts > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'}
                />
                <SubRow
                  label="Sponsored Brands Video"
                  value={formatCurrency(-data.adsBreakdown.sponsoredBrandsVideo)}
                  valueColor={data.adsBreakdown.sponsoredBrandsVideo > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'}
                />
                <SubRow
                  label="Sponsored Display"
                  value={formatCurrency(-data.adsBreakdown.sponsoredDisplay)}
                  valueColor={data.adsBreakdown.sponsoredDisplay > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'}
                />
                <SubRow
                  label="Sponsored Brands"
                  value={formatCurrency(-data.adsBreakdown.sponsoredBrands)}
                  valueColor={data.adsBreakdown.sponsoredBrands > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'}
                />
              </>
            ) : (
              <>
                {/* Fallback: Show total ad spend as SP until Ads API data arrives */}
                <SubRow label="Sponsored Products" value={formatCurrency(-safeAdSpend)} valueColor={safeAdSpend > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'} />
                <SubRow label="Sponsored Brands Video" value="$0.00" valueColor={STARBUCKS.darkGreen + '60'} />
                <SubRow label="Sponsored Display" value="$0.00" valueColor={STARBUCKS.darkGreen + '60'} />
                <SubRow label="Sponsored Brands" value="$0.00" valueColor={STARBUCKS.darkGreen + '60'} />
              </>
            )}
          </CollapsibleRow>

          {/* Refund cost - Expandable (Sellerboard Parity) */}
          <CollapsibleRow
            label="Refund cost"
            value={formatCurrency(-(safeRefunds + (fees?.refundCommission || 0) - (fees?.refundedReferral || 0)))}
            valueColor={(safeRefunds + (fees?.refundCommission || 0)) > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'}
            defaultOpen={false}
          >
            <SubRow label="Refunded amount" value={formatCurrency(-safeRefunds)} valueColor={safeRefunds > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'} />
            <SubRow label="Refund commission" value={formatCurrency(-(fees?.refundCommission || 0))} valueColor={(fees?.refundCommission || 0) > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'} />
            <SubRow label="Refunded referral fee" value={formatCurrency(fees?.refundedReferral || 0)} valueColor={(fees?.refundedReferral || 0) > 0 ? STARBUCKS.primaryGreen : STARBUCKS.darkGreen + '60'} />
          </CollapsibleRow>

          {/* Amazon fees - Expandable (DETAILED) - SELLERBOARD PARITY */}
          <CollapsibleRow
            label="Amazon fees"
            value={formatCurrency(-data.amazonFees)}
            valueColor="#DC2626"
            defaultOpen={true}
          >
            {hasRealFees && fees ? (
              <>
                {/* === CORE FEES (Always show) === */}

                {/* FBA per unit fulfilment fee */}
                <SubRow
                  label="FBA per unit fulfilment fee"
                  value={formatCurrency(-fees.fbaFulfillment)}
                  valueColor={fees.fbaFulfillment > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'}
                />

                {/* MCF - Multi-Channel Fulfillment (SEPARATE from FBA!) */}
                {fees.mcf > 0 && (
                  <SubRow
                    label="FBA fee (MCF)"
                    value={formatCurrency(-fees.mcf)}
                    valueColor="#DC2626"
                  />
                )}

                {/* Referral fee */}
                <SubRow
                  label="Referral fee"
                  value={formatCurrency(-fees.referral)}
                  valueColor={fees.referral > 0 ? "#DC2626" : STARBUCKS.darkGreen + '60'}
                />

                {/* === STORAGE FEES === */}

                {/* FBA storage fee (monthly) */}
                {fees.storage > 0 && (
                  <SubRow
                    label="FBA storage fee"
                    value={formatCurrency(-fees.storage)}
                    valueColor="#DC2626"
                  />
                )}

                {/* Long term storage fee (6+ months) - SEPARATE from regular storage */}
                {fees.longTermStorage > 0 && (
                  <SubRow
                    label="Long term storage fee"
                    value={formatCurrency(-fees.longTermStorage)}
                    valueColor="#DC2626"
                  />
                )}

                {/* === INBOUND / OUTBOUND FEES === */}

                {/* Inbound transportation / convenience fee */}
                {fees.inbound > 0 && (
                  <SubRow
                    label="Inbound transportation"
                    value={formatCurrency(-fees.inbound)}
                    valueColor="#DC2626"
                  />
                )}

                {/* FBA disposal / removal fee */}
                {fees.removal > 0 && (
                  <SubRow
                    label="FBA disposal fee"
                    value={formatCurrency(-fees.removal)}
                    valueColor="#DC2626"
                  />
                )}

                {/* FBA customer return per unit fee */}
                {fees.returns > 0 && (
                  <SubRow
                    label="FBA customer return per unit fee"
                    value={formatCurrency(-fees.returns)}
                    valueColor="#DC2626"
                  />
                )}

                {/* === SERVICE FEES (Subscription, Digital, etc.) === */}

                {/* Subscription fee (show for weekly+ periods) */}
                {shouldShowSubscriptionFee(data.label) && data.serviceFees && data.serviceFees.subscription > 0 && (
                  <SubRow
                    label="Subscription"
                    value={formatCurrency(-data.serviceFees.subscription)}
                    valueColor="#DC2626"
                  />
                )}

                {/* Digital services fee */}
                {fees.digitalServices > 0 && (
                  <SubRow
                    label="Digital services fee"
                    value={formatCurrency(-fees.digitalServices)}
                    valueColor="#DC2626"
                  />
                )}

                {/* === REIMBURSEMENTS (positive values - money back to seller) === */}

                {/* Warehouse damage reimbursement */}
                {fees.warehouseDamage > 0 && (
                  <SubRow
                    label="Warehouse damage"
                    value={formatCurrency(fees.warehouseDamage)}
                    valueColor={STARBUCKS.primaryGreen}
                  />
                )}

                {/* Warehouse lost reimbursement */}
                {fees.warehouseLost > 0 && (
                  <SubRow
                    label="Warehouse lost"
                    value={formatCurrency(fees.warehouseLost)}
                    valueColor={STARBUCKS.primaryGreen}
                  />
                )}

                {/* Reversal reimbursement */}
                {(fees.reversalReimbursement > 0 || fees.reimbursements > 0) && (
                  <SubRow
                    label="Reversal reimbursement"
                    value={formatCurrency(fees.reversalReimbursement || fees.reimbursements)}
                    valueColor={STARBUCKS.primaryGreen}
                  />
                )}

                {/* === OTHER FEES === */}

                {/* Other miscellaneous fees */}
                {fees.other > 0 && (
                  <SubRow
                    label="Other fees"
                    value={formatCurrency(-fees.other)}
                    valueColor="#DC2626"
                  />
                )}

                {/* Chargebacks */}
                {fees.chargebacks > 0 && (
                  <SubRow
                    label="Chargebacks"
                    value={formatCurrency(-fees.chargebacks)}
                    valueColor="#DC2626"
                  />
                )}

                {/* Other service fees (from serviceFees table) */}
                {shouldShowSubscriptionFee(data.label) && data.serviceFees && data.serviceFees.other > 0 && (
                  <SubRow
                    label="Other service fees"
                    value={formatCurrency(-data.serviceFees.other)}
                    valueColor="#DC2626"
                  />
                )}
              </>
            ) : (
              <>
                {/* Estimated breakdown when no real data */}
                <SubRow label="FBA per unit fulfilment fee" value={formatCurrency(-data.amazonFees * 0.55)} valueColor="#DC2626" />
                <SubRow label="Referral fee" value={formatCurrency(-data.amazonFees * 0.40)} valueColor="#DC2626" />
                <SubRow label="FBA storage fee" value={formatCurrency(-data.amazonFees * 0.05)} valueColor="#DC2626" />
                {shouldShowSubscriptionFee(data.label) && (
                  <>
                    <SubRow label="Subscription" value="$0.00" valueColor={STARBUCKS.darkGreen + '60'} />
                  </>
                )}
                <div className="px-10 py-2 text-xs italic" style={{ color: STARBUCKS.gold }}>
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
            valueColor={safeCogs > 0 ? STARBUCKS.gold : STARBUCKS.darkGreen + '60'}
            hasWarning={safeCogs === 0}
          />

          {/* Gross profit */}
          <CollapsibleRow
            label="Gross profit"
            value={formatCurrency(grossProfit)}
            valueColor={grossProfit >= 0 ? STARBUCKS.darkGreen : "#DC2626"}
            hasWarning={grossProfit < 0}
          />

          {/* Indirect expenses */}
          <CollapsibleRow
            label="Indirect expenses"
            value="$0.00"
            valueColor={STARBUCKS.darkGreen + '60'}
          />

          {/* Net profit - BOLD */}
          <CollapsibleRow
            label="Net profit"
            value={formatCurrency(netProfit)}
            valueColor={netProfit >= 0 ? STARBUCKS.primaryGreen : "#DC2626"}
            isBold
            hasWarning={netProfit < 0}
          />

          {/* Estimated payout */}
          <CollapsibleRow
            label="Estimated payout"
            value={formatCurrency(estPayout)}
            valueColor={STARBUCKS.darkGreen}
          />

          <Divider />

          {/* Metrics Section */}
          <CollapsibleRow
            label="Real ACOS"
            value={formatPercent(realAcos)}
            valueColor={STARBUCKS.darkGreen}
          />

          <CollapsibleRow
            label="% Refunds"
            value={formatPercent(refundRate)}
            valueColor={refundRate > 10 ? "#DC2626" : STARBUCKS.darkGreen}
          />

          <CollapsibleRow
            label="Sellable returns"
            value="0.00%"
            valueColor={STARBUCKS.darkGreen + '60'}
          />

          <CollapsibleRow
            label="Margin"
            value={formatPercent(margin)}
            valueColor={margin >= 0 ? STARBUCKS.darkGreen : "#DC2626"}
          />

          <CollapsibleRow
            label="ROI"
            value={formatPercent(roi)}
            valueColor={STARBUCKS.darkGreen}
          />

          <Divider />

          {/* Additional Metrics */}
          <CollapsibleRow
            label="Active subscriptions (SnS)"
            value="0"
            valueColor={STARBUCKS.darkGreen + '60'}
          />

          <CollapsibleRow
            label="Sessions"
            value="-"
            valueColor={STARBUCKS.darkGreen + '60'}
            defaultOpen={false}
          >
            <SubRow label="Browser sessions" value="-" valueColor={STARBUCKS.darkGreen + '60'} />
            <SubRow label="Mobile app sessions" value="-" valueColor={STARBUCKS.darkGreen + '60'} />
          </CollapsibleRow>

          <CollapsibleRow
            label="Unit session percentage"
            value="-"
            valueColor={STARBUCKS.darkGreen + '60'}
          />

          {/* Bottom padding */}
          <div className="h-4" />
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4"
          style={{ borderTop: `1px solid ${STARBUCKS.lightGreen}`, backgroundColor: STARBUCKS.cream }}
        >
          <button
            onClick={onClose}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
            className="w-full py-3 font-semibold rounded-xl transition-all"
            style={{
              background: buttonHovered
                ? `linear-gradient(135deg, ${STARBUCKS.primaryGreen} 0%, ${STARBUCKS.darkGreen} 100%)`
                : `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`,
              color: STARBUCKS.white,
              boxShadow: buttonHovered ? `0 8px 24px ${STARBUCKS.darkGreen}40` : 'none'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
