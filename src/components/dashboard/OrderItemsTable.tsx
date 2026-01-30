'use client'

import React, { useState } from 'react'
import { Download, Search, Package, ExternalLink, MessageSquare, ChevronDown, ChevronRight, Truck, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

export interface OrderItemData {
  id: string
  orderId: string
  orderItemId: string
  orderDate: string
  orderStatus: 'Pending' | 'Shipped' | 'Delivered' | 'Canceled' | 'Refunded'
  fulfillmentChannel: 'FBA' | 'FBM'
  // Product info
  asin: string
  sku: string
  title: string
  imageUrl?: string
  // Quantities
  quantityOrdered: number
  quantityShipped: number
  refundedQuantity: number
  // Financials
  itemPrice: number
  shippingPrice: number
  cogs: number
  amazonFees: number
  adSpend: number
  expenses: number // Other expenses
  netProfit: number
  // Optional
  couponDiscount?: number
  promotionDiscount?: number
  comment?: string
  // Fee breakdown
  feeBreakdown?: {
    fbaFulfillment: number
    referral: number
    storage: number
    other: number
  }
}

interface OrderItemsTableProps {
  orderItems: OrderItemData[]
  onOrderClick?: (item: OrderItemData) => void
}

function getStatusIcon(status: OrderItemData['orderStatus']) {
  switch (status) {
    case 'Shipped':
      return <Truck className="w-4 h-4" />
    case 'Delivered':
      return <CheckCircle className="w-4 h-4" />
    case 'Pending':
      return <Clock className="w-4 h-4" />
    case 'Canceled':
      return <XCircle className="w-4 h-4" />
    case 'Refunded':
      return <RotateCcw className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

function getStatusColor(status: OrderItemData['orderStatus'], isSelected: boolean = false) {
  const colors: Record<string, { bg: string; text: string }> = {
    Shipped: { bg: '#E0F2FE', text: '#0369A1' },
    Delivered: { bg: STARBUCKS.lightGreen, text: STARBUCKS.primaryGreen },
    Pending: { bg: '#FEF3C7', text: '#D97706' },
    Canceled: { bg: '#FEE2E2', text: '#DC2626' },
    Refunded: { bg: '#FEE2E2', text: '#DC2626' },
  }
  return colors[status] || colors.Pending
}

function OrderItemRow({
  item,
  isExpanded,
  onToggle,
  onOrderClick
}: {
  item: OrderItemData
  isExpanded: boolean
  onToggle: () => void
  onOrderClick?: (item: OrderItemData) => void
}) {
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statusColors = getStatusColor(item.orderStatus)
  const hasRefund = item.refundedQuantity > 0 || item.orderStatus === 'Refunded'

  return (
    <>
      <tr
        className="transition-colors cursor-pointer"
        style={{
          borderBottom: `1px solid ${STARBUCKS.lightGreen}`,
          backgroundColor: hasRefund ? '#FEF2F2' : 'transparent',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hasRefund ? '#FEE2E2' : STARBUCKS.lightGreen}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = hasRefund ? '#FEF2F2' : 'transparent'}
        onClick={onToggle}
      >
        {/* Expand/Collapse */}
        <td className="py-3 px-2 w-10">
          <button
            className="p-1 rounded transition-colors"
            style={{ backgroundColor: 'transparent' }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
            ) : (
              <ChevronRight className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
            )}
          </button>
        </td>

        {/* Order ID */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: STARBUCKS.darkGreen }}>
              {item.orderId.slice(-8)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://sellercentral.amazon.com/orders-v3/order/${item.orderId}`, '_blank')
              }}
              className="p-1 rounded hover:bg-gray-100"
            >
              <ExternalLink className="w-3 h-3" style={{ color: STARBUCKS.primaryGreen }} />
            </button>
          </div>
        </td>

        {/* Date */}
        <td className="py-3 px-4">
          <span className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>
            {formatDate(item.orderDate)}
          </span>
        </td>

        {/* Status */}
        <td className="py-3 px-4">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
          >
            {getStatusIcon(item.orderStatus)}
            {item.orderStatus}
          </span>
        </td>

        {/* Product */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-10 h-10 rounded-lg object-cover"
                style={{ backgroundColor: STARBUCKS.lightGreen }}
              />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: STARBUCKS.lightGreen }}>
                <Package className="w-5 h-5" style={{ color: STARBUCKS.primaryGreen }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[180px]" style={{ color: STARBUCKS.darkGreen }}>
                {item.title}
              </p>
              <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>
                {item.asin} {item.sku && `• ${item.sku}`}
              </p>
            </div>
          </div>
        </td>

        {/* Units */}
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-medium" style={{ color: STARBUCKS.darkGreen }}>
            {item.quantityShipped || item.quantityOrdered}
          </span>
        </td>

        {/* Refunds */}
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-medium" style={{ color: item.refundedQuantity > 0 ? '#DC2626' : STARBUCKS.primaryGreen + 'AA' }}>
            {item.refundedQuantity}
          </span>
        </td>

        {/* Sales */}
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold" style={{ color: STARBUCKS.darkGreen }}>
            {formatCurrency(item.itemPrice)}
          </span>
        </td>

        {/* COGS */}
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-medium" style={{ color: STARBUCKS.gold }}>
            {formatCurrency(item.cogs)}
          </span>
        </td>

        {/* Amazon Fees */}
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-medium" style={{ color: '#DC2626' }}>
            {formatCurrency(item.amazonFees)}
          </span>
        </td>

        {/* Expenses */}
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-medium" style={{ color: STARBUCKS.gold }}>
            {formatCurrency(item.adSpend + item.expenses)}
          </span>
        </td>

        {/* Net Profit */}
        <td className="py-3 px-4 text-right">
          <span className="text-sm font-semibold" style={{ color: item.netProfit >= 0 ? STARBUCKS.primaryGreen : '#DC2626' }}>
            {formatCurrency(item.netProfit)}
          </span>
        </td>

        {/* Coupon */}
        <td className="py-3 px-4 text-right">
          {item.couponDiscount || item.promotionDiscount ? (
            <span className="text-sm font-medium" style={{ color: '#9333EA' }}>
              {formatCurrency((item.couponDiscount || 0) + (item.promotionDiscount || 0))}
            </span>
          ) : (
            <span className="text-xs" style={{ color: STARBUCKS.primaryGreen + 'AA' }}>-</span>
          )}
        </td>

        {/* Comment */}
        <td className="py-3 px-4 text-center">
          {item.comment ? (
            <button className="p-1 rounded hover:bg-gray-100" title={item.comment}>
              <MessageSquare className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
            </button>
          ) : (
            <span className="text-xs" style={{ color: STARBUCKS.primaryGreen + 'AA' }}>-</span>
          )}
        </td>
      </tr>

      {/* Expanded Row - Fee Details */}
      {isExpanded && (
        <tr style={{ backgroundColor: STARBUCKS.lightGreen + '40' }}>
          <td colSpan={14} className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Fee Breakdown */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: STARBUCKS.white }}>
                <h4 className="text-xs font-semibold mb-2" style={{ color: STARBUCKS.darkGreen }}>Amazon Fees Breakdown</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>FBA Fulfillment</span>
                    <span style={{ color: '#DC2626' }}>{formatCurrency(item.feeBreakdown?.fbaFulfillment || item.amazonFees * 0.6)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Referral Fee</span>
                    <span style={{ color: '#DC2626' }}>{formatCurrency(item.feeBreakdown?.referral || item.amazonFees * 0.35)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Other Fees</span>
                    <span style={{ color: '#DC2626' }}>{formatCurrency(item.feeBreakdown?.other || item.amazonFees * 0.05)}</span>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: STARBUCKS.white }}>
                <h4 className="text-xs font-semibold mb-2" style={{ color: STARBUCKS.darkGreen }}>Order Details</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Fulfillment</span>
                    <span className="font-medium" style={{ color: STARBUCKS.darkGreen }}>{item.fulfillmentChannel}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Qty Ordered</span>
                    <span className="font-medium" style={{ color: STARBUCKS.darkGreen }}>{item.quantityOrdered}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Qty Shipped</span>
                    <span className="font-medium" style={{ color: STARBUCKS.darkGreen }}>{item.quantityShipped}</span>
                  </div>
                </div>
              </div>

              {/* Financials */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: STARBUCKS.white }}>
                <h4 className="text-xs font-semibold mb-2" style={{ color: STARBUCKS.darkGreen }}>Financials</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Item Price</span>
                    <span className="font-medium" style={{ color: STARBUCKS.darkGreen }}>{formatCurrency(item.itemPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Shipping</span>
                    <span className="font-medium" style={{ color: STARBUCKS.darkGreen }}>{formatCurrency(item.shippingPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Ad Spend</span>
                    <span style={{ color: '#DC2626' }}>{formatCurrency(item.adSpend)}</span>
                  </div>
                </div>
              </div>

              {/* Profit Calculation */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: STARBUCKS.white }}>
                <h4 className="text-xs font-semibold mb-2" style={{ color: STARBUCKS.darkGreen }}>Profit Calculation</h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Revenue</span>
                    <span className="font-medium" style={{ color: STARBUCKS.darkGreen }}>{formatCurrency(item.itemPrice + item.shippingPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: STARBUCKS.primaryGreen }}>Total Costs</span>
                    <span style={{ color: '#DC2626' }}>{formatCurrency(item.cogs + item.amazonFees + item.adSpend + item.expenses)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold border-t pt-1" style={{ borderColor: STARBUCKS.lightGreen }}>
                    <span style={{ color: STARBUCKS.darkGreen }}>Net Profit</span>
                    <span style={{ color: item.netProfit >= 0 ? STARBUCKS.primaryGreen : '#DC2626' }}>{formatCurrency(item.netProfit)}</span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function OrderItemsTable({ orderItems, onOrderClick }: OrderItemsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Filter order items
  const filteredItems = orderItems.filter(item => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      item.orderId.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.asin.toLowerCase().includes(query) ||
      (item.sku && item.sku.toLowerCase().includes(query))

    const matchesStatus = statusFilter === 'all' || item.orderStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate totals
  const totals = filteredItems.reduce((acc, item) => {
    acc.units += item.quantityShipped || item.quantityOrdered
    acc.refunds += item.refundedQuantity
    acc.sales += item.itemPrice
    acc.cogs += item.cogs
    acc.amazonFees += item.amazonFees
    acc.expenses += item.adSpend + item.expenses
    acc.netProfit += item.netProfit
    return acc
  }, { units: 0, refunds: 0, sales: 0, cogs: 0, amazonFees: 0, expenses: 0, netProfit: 0 })

  // Export CSV
  const exportCSV = () => {
    const headers = ['Order ID', 'Date', 'Status', 'ASIN', 'SKU', 'Title', 'Units', 'Refunds', 'Sales', 'COGS', 'Amazon Fees', 'Expenses', 'Net Profit', 'Coupon']
    const rows: string[][] = [headers]

    filteredItems.forEach(item => {
      rows.push([
        item.orderId,
        item.orderDate,
        item.orderStatus,
        item.asin,
        item.sku || '',
        `"${item.title.replace(/"/g, '""')}"`,
        (item.quantityShipped || item.quantityOrdered).toString(),
        item.refundedQuantity.toString(),
        item.itemPrice.toFixed(2),
        item.cogs.toFixed(2),
        item.amazonFees.toFixed(2),
        (item.adSpend + item.expenses).toFixed(2),
        item.netProfit.toFixed(2),
        ((item.couponDiscount || 0) + (item.promotionDiscount || 0)).toFixed(2)
      ])
    })

    const csvContent = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `order_items_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: STARBUCKS.cream, border: `1px solid ${STARBUCKS.lightGreen}` }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4" style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }}>
        <h3 className="text-lg font-semibold" style={{ color: STARBUCKS.darkGreen }}>Order Items</h3>
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: STARBUCKS.white,
              border: `1px solid ${STARBUCKS.lightGreen}`,
              color: STARBUCKS.darkGreen,
            }}
          >
            <option value="all">All Status</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Pending">Pending</option>
            <option value="Canceled">Canceled</option>
            <option value="Refunded">Refunded</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 w-48"
              style={{
                backgroundColor: STARBUCKS.white,
                border: `1px solid ${STARBUCKS.lightGreen}`,
                color: STARBUCKS.darkGreen,
              }}
            />
          </div>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all hover:shadow-lg"
            style={{ background: `linear-gradient(135deg, ${STARBUCKS.darkGreen} 0%, ${STARBUCKS.primaryGreen} 100%)`, color: STARBUCKS.white }}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ backgroundColor: STARBUCKS.white }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: STARBUCKS.lightGreen, borderBottom: `1px solid ${STARBUCKS.primaryGreen}20` }}>
              <th className="py-3 px-2 w-10"></th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Order
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Date
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Status
              </th>
              <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Product
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Units
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Refunds
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Sales
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                COGS
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Fees
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Expenses
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Net
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Coupon
              </th>
              <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <OrderItemRow
                key={item.id}
                item={item}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => toggleItem(item.id)}
                onOrderClick={onOrderClick}
              />
            ))}

            {/* Totals Row */}
            <tr className="font-semibold" style={{ backgroundColor: STARBUCKS.lightGreen, borderTop: `2px solid ${STARBUCKS.primaryGreen}` }}>
              <td className="py-4 px-2"></td>
              <td className="py-4 px-4 text-sm" style={{ color: STARBUCKS.darkGreen }}>
                Total ({filteredItems.length} items)
              </td>
              <td className="py-4 px-4"></td>
              <td className="py-4 px-4"></td>
              <td className="py-4 px-4"></td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.darkGreen }}>
                {totals.units.toLocaleString()}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: '#DC2626' }}>
                {totals.refunds}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.darkGreen }}>
                {formatCurrency(totals.sales)}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.gold }}>
                {formatCurrency(totals.cogs)}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: '#DC2626' }}>
                {formatCurrency(totals.amazonFees)}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.gold }}>
                {formatCurrency(totals.expenses)}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: totals.netProfit >= 0 ? STARBUCKS.primaryGreen : '#DC2626' }}>
                {formatCurrency(totals.netProfit)}
              </td>
              <td className="py-4 px-4"></td>
              <td className="py-4 px-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="py-12 text-center" style={{ backgroundColor: STARBUCKS.white }}>
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: STARBUCKS.lightGreen }} />
          <p style={{ color: STARBUCKS.primaryGreen }}>No order items found</p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all') }}
              className="mt-2 text-sm font-medium transition-colors"
              style={{ color: STARBUCKS.primaryGreen }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
