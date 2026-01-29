'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Download, Search, Settings, MoreHorizontal, Package } from 'lucide-react'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

export interface ProductData {
  id: string
  asin: string
  sku: string
  title: string
  imageUrl?: string
  isParent?: boolean
  parentAsin?: string
  children?: ProductData[]
  // Metrics
  stock: number | null // null = Coming Soon (FBA Inventory API pending)
  units: number
  refunds: number
  cogs: number // Cost of Goods Sold - entered via Product Settings or AI Chat
  sales: number
  adSpend: number
  grossProfit: number
  netProfit: number
  margin: number
  roi: number
  bsr: number | null
}

interface ProductTableProps {
  products: ProductData[]
  onProductClick?: (product: ProductData) => void
  onSettingsClick?: () => void
}

function ProductRow({
  product,
  isChild = false,
  isExpanded = false,
  onToggle,
  onProductClick
}: {
  product: ProductData
  isChild?: boolean
  isExpanded?: boolean
  onToggle?: () => void
  onProductClick?: (product: ProductData) => void
}) {
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return STARBUCKS.primaryGreen
    if (margin >= 15) return STARBUCKS.gold
    return '#DC2626'
  }

  const getRoiColor = (roi: number) => {
    if (roi >= 100) return STARBUCKS.primaryGreen
    if (roi >= 50) return STARBUCKS.gold
    return '#DC2626'
  }

  return (
    <tr
      className="transition-colors"
      style={{
        borderBottom: `1px solid ${STARBUCKS.lightGreen}`,
        backgroundColor: isChild ? `${STARBUCKS.lightGreen}40` : 'transparent',
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isChild ? `${STARBUCKS.lightGreen}40` : 'transparent'}
    >
      {/* Expand/Collapse */}
      <td className="py-3 px-2 w-10">
        {product.isParent && product.children && product.children.length > 0 ? (
          <button
            onClick={onToggle}
            className="p-1 rounded transition-colors"
            style={{ backgroundColor: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
            ) : (
              <ChevronRight className="w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
            )}
          </button>
        ) : isChild ? (
          <div className="w-4 h-4 ml-1 border-l-2 border-b-2 rounded-bl" style={{ borderColor: STARBUCKS.primaryGreen + '50' }} />
        ) : null}
      </td>

      {/* Product */}
      <td className="py-3 px-4">
        <div className={`flex items-center gap-3 ${isChild ? 'pl-4' : ''}`}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-10 h-10 rounded-lg object-cover"
              style={{ backgroundColor: STARBUCKS.lightGreen }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: STARBUCKS.lightGreen }}>
              <Package className="w-5 h-5" style={{ color: STARBUCKS.primaryGreen }} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[200px]" style={{ color: STARBUCKS.darkGreen }}>
              {product.title}
            </p>
            <p className="text-xs" style={{ color: STARBUCKS.primaryGreen }}>
              {product.asin} {product.sku && `• ${product.sku}`}
            </p>
          </div>
        </div>
      </td>

      {/* Stock */}
      <td className="py-3 px-4 text-right">
        {product.stock !== null ? (
          <span className="text-sm font-medium" style={{ color: product.stock < 10 ? '#DC2626' : STARBUCKS.darkGreen }}>
            {product.stock.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs italic" style={{ color: STARBUCKS.primaryGreen + 'AA' }}>Coming Soon</span>
        )}
      </td>

      {/* Units */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium" style={{ color: STARBUCKS.darkGreen }}>
          {product.units.toLocaleString()}
        </span>
      </td>

      {/* Refunds */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium" style={{ color: product.refunds > 0 ? '#DC2626' : STARBUCKS.primaryGreen + 'AA' }}>
          {product.refunds}
        </span>
      </td>

      {/* COGS */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium" style={{ color: STARBUCKS.gold }}>
          {formatCurrency(product.cogs)}
        </span>
      </td>

      {/* Sales */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-semibold" style={{ color: STARBUCKS.darkGreen }}>
          {formatCurrency(product.sales)}
        </span>
      </td>

      {/* Ad Spend */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium" style={{ color: '#DC2626' }}>
          {formatCurrency(product.adSpend)}
        </span>
      </td>

      {/* Gross Profit */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium" style={{ color: product.grossProfit >= 0 ? STARBUCKS.primaryGreen : '#DC2626' }}>
          {formatCurrency(product.grossProfit)}
        </span>
      </td>

      {/* Net Profit */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-semibold" style={{ color: product.netProfit >= 0 ? STARBUCKS.primaryGreen : '#DC2626' }}>
          {formatCurrency(product.netProfit)}
        </span>
      </td>

      {/* Margin */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium" style={{ color: getMarginColor(product.margin) }}>
          {product.margin.toFixed(1)}%
        </span>
      </td>

      {/* ROI */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium" style={{ color: getRoiColor(product.roi) }}>
          {product.roi.toFixed(0)}%
        </span>
      </td>

      {/* BSR */}
      <td className="py-3 px-4 text-right">
        {product.bsr !== null ? (
          <span className="text-sm font-medium" style={{ color: STARBUCKS.darkGreen }}>
            #{product.bsr.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs" style={{ color: STARBUCKS.primaryGreen + 'AA' }}>-</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        <button
          onClick={() => onProductClick?.(product)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: STARBUCKS.primaryGreen }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen
            e.currentTarget.style.color = STARBUCKS.darkGreen
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = STARBUCKS.primaryGreen
          }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </td>
    </tr>
  )
}

export default function ProductTable({ products, onProductClick, onSettingsClick }: ProductTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())

  const toggleParent = (parentId: string) => {
    setExpandedParents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(parentId)) {
        newSet.delete(parentId)
      } else {
        newSet.add(parentId)
      }
      return newSet
    })
  }

  // Filter products by search
  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase()
    const matchesParent =
      product.title.toLowerCase().includes(query) ||
      product.asin.toLowerCase().includes(query) ||
      (product.sku && product.sku.toLowerCase().includes(query))

    if (matchesParent) return true

    // Check children
    if (product.children) {
      return product.children.some(child =>
        child.title.toLowerCase().includes(query) ||
        child.asin.toLowerCase().includes(query) ||
        (child.sku && child.sku.toLowerCase().includes(query))
      )
    }

    return false
  })

  // Calculate totals
  const totals = filteredProducts.reduce((acc, product) => {
    const addProduct = (p: ProductData) => {
      acc.units += p.units
      acc.refunds += p.refunds
      acc.cogs += p.cogs
      acc.sales += p.sales
      acc.adSpend += p.adSpend
      acc.grossProfit += p.grossProfit
      acc.netProfit += p.netProfit
    }

    if (product.isParent && product.children) {
      product.children.forEach(addProduct)
    } else if (!product.parentAsin) {
      addProduct(product)
    }

    return acc
  }, { units: 0, refunds: 0, cogs: 0, sales: 0, adSpend: 0, grossProfit: 0, netProfit: 0 })

  const totalMargin = totals.sales > 0 ? (totals.netProfit / totals.sales) * 100 : 0

  // Export CSV
  const exportCSV = () => {
    const headers = ['ASIN', 'SKU', 'Title', 'Stock', 'Units', 'Refunds', 'COGS', 'Sales', 'Ad Spend', 'Gross Profit', 'Net Profit', 'Margin', 'ROI', 'BSR']
    const rows: string[][] = [headers]

    const addRow = (p: ProductData) => {
      rows.push([
        p.asin,
        p.sku || '',
        `"${p.title.replace(/"/g, '""')}"`,
        p.stock !== null ? p.stock.toString() : '',
        p.units.toString(),
        p.refunds.toString(),
        p.cogs.toFixed(2),
        p.sales.toFixed(2),
        p.adSpend.toFixed(2),
        p.grossProfit.toFixed(2),
        p.netProfit.toFixed(2),
        p.margin.toFixed(1),
        p.roi.toFixed(0),
        p.bsr !== null ? p.bsr.toString() : ''
      ])
    }

    filteredProducts.forEach(product => {
      if (product.isParent && product.children) {
        addRow(product)
        product.children.forEach(addRow)
      } else {
        addRow(product)
      }
    })

    const csvContent = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: STARBUCKS.cream, border: `1px solid ${STARBUCKS.lightGreen}` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${STARBUCKS.lightGreen}` }}>
        <h3 className="text-lg font-semibold" style={{ color: STARBUCKS.darkGreen }}>Products</h3>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: STARBUCKS.primaryGreen }} />
            <input
              type="text"
              placeholder="Search ASIN, SKU, Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 w-64"
              style={{
                backgroundColor: STARBUCKS.white,
                border: `1px solid ${STARBUCKS.lightGreen}`,
                color: STARBUCKS.darkGreen,
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = STARBUCKS.primaryGreen}
              onBlur={(e) => e.currentTarget.style.borderColor = STARBUCKS.lightGreen}
            />
          </div>

          {/* Product Settings */}
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ backgroundColor: STARBUCKS.lightGreen, color: STARBUCKS.darkGreen }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.primaryGreen + '30'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = STARBUCKS.lightGreen}
          >
            <Settings className="w-4 h-4" />
            Product Settings
          </button>

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
                Product
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Stock
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Units
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Refunds
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                COGS
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Sales
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Ad Spend
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Gross
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Net
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                Margin
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                ROI
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                BSR
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: STARBUCKS.darkGreen }}>
                More
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <React.Fragment key={product.id}>
                <ProductRow
                  product={product}
                  isExpanded={expandedParents.has(product.id)}
                  onToggle={() => toggleParent(product.id)}
                  onProductClick={onProductClick}
                />
                {/* Children */}
                {product.isParent && product.children && expandedParents.has(product.id) && (
                  product.children.map(child => (
                    <ProductRow
                      key={child.id}
                      product={child}
                      isChild={true}
                      onProductClick={onProductClick}
                    />
                  ))
                )}
              </React.Fragment>
            ))}

            {/* Totals Row */}
            <tr className="font-semibold" style={{ backgroundColor: STARBUCKS.lightGreen, borderTop: `2px solid ${STARBUCKS.primaryGreen}` }}>
              <td className="py-4 px-2"></td>
              <td className="py-4 px-4 text-sm" style={{ color: STARBUCKS.darkGreen }}>
                Total ({filteredProducts.length} products)
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.primaryGreen + 'AA' }}>-</td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.darkGreen }}>
                {totals.units.toLocaleString()}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: '#DC2626' }}>
                {totals.refunds}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.gold }}>
                ${totals.cogs.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.darkGreen }}>
                ${totals.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: '#DC2626' }}>
                ${totals.adSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.primaryGreen }}>
                ${totals.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.primaryGreen }}>
                ${totals.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.darkGreen }}>
                {totalMargin.toFixed(1)}%
              </td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.primaryGreen + 'AA' }}>-</td>
              <td className="py-4 px-4 text-right text-sm" style={{ color: STARBUCKS.primaryGreen + 'AA' }}>-</td>
              <td className="py-4 px-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="py-12 text-center" style={{ backgroundColor: STARBUCKS.white }}>
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: STARBUCKS.lightGreen }} />
          <p style={{ color: STARBUCKS.primaryGreen }}>No products found</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm font-medium transition-colors"
              style={{ color: STARBUCKS.primaryGreen }}
              onMouseEnter={(e) => e.currentTarget.style.color = STARBUCKS.darkGreen}
              onMouseLeave={(e) => e.currentTarget.style.color = STARBUCKS.primaryGreen}
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  )
}
