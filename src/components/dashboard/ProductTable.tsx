'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Download, Search, Settings, MoreHorizontal, Package, TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
    if (margin >= 30) return 'text-emerald-600'
    if (margin >= 15) return 'text-amber-600'
    return 'text-red-600'
  }

  const getRoiColor = (roi: number) => {
    if (roi >= 100) return 'text-emerald-600'
    if (roi >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <tr className={`
      border-b border-gray-100 hover:bg-gray-50 transition-colors
      ${isChild ? 'bg-gray-50/50' : ''}
    `}>
      {/* Expand/Collapse */}
      <td className="py-3 px-2 w-10">
        {product.isParent && product.children && product.children.length > 0 ? (
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : isChild ? (
          <div className="w-4 h-4 ml-1 border-l-2 border-b-2 border-gray-300 rounded-bl" />
        ) : null}
      </td>

      {/* Product */}
      <td className="py-3 px-4">
        <div className={`flex items-center gap-3 ${isChild ? 'pl-4' : ''}`}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-10 h-10 rounded-lg object-cover bg-gray-100"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {product.title}
            </p>
            <p className="text-xs text-gray-500">
              {product.asin} {product.sku && `• ${product.sku}`}
            </p>
          </div>
        </div>
      </td>

      {/* Stock */}
      <td className="py-3 px-4 text-right">
        {product.stock !== null ? (
          <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
            {product.stock.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-gray-400 italic">Coming Soon</span>
        )}
      </td>

      {/* Units */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium text-gray-900">
          {product.units.toLocaleString()}
        </span>
      </td>

      {/* Refunds */}
      <td className="py-3 px-4 text-right">
        <span className={`text-sm font-medium ${product.refunds > 0 ? 'text-red-600' : 'text-gray-500'}`}>
          {product.refunds}
        </span>
      </td>

      {/* COGS */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium text-orange-600">
          {formatCurrency(product.cogs)}
        </span>
      </td>

      {/* Sales */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-semibold text-gray-900">
          {formatCurrency(product.sales)}
        </span>
      </td>

      {/* Ad Spend */}
      <td className="py-3 px-4 text-right">
        <span className="text-sm font-medium text-red-600">
          {formatCurrency(product.adSpend)}
        </span>
      </td>

      {/* Gross Profit */}
      <td className="py-3 px-4 text-right">
        <span className={`text-sm font-medium ${product.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {formatCurrency(product.grossProfit)}
        </span>
      </td>

      {/* Net Profit */}
      <td className="py-3 px-4 text-right">
        <span className={`text-sm font-semibold ${product.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {formatCurrency(product.netProfit)}
        </span>
      </td>

      {/* Margin */}
      <td className="py-3 px-4 text-right">
        <span className={`text-sm font-medium ${getMarginColor(product.margin)}`}>
          {product.margin.toFixed(1)}%
        </span>
      </td>

      {/* ROI */}
      <td className="py-3 px-4 text-right">
        <span className={`text-sm font-medium ${getRoiColor(product.roi)}`}>
          {product.roi.toFixed(0)}%
        </span>
      </td>

      {/* BSR */}
      <td className="py-3 px-4 text-right">
        {product.bsr !== null ? (
          <span className="text-sm font-medium text-gray-700">
            #{product.bsr.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right">
        <button
          onClick={() => onProductClick?.(product)}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Products</h3>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ASIN, SKU, Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>

          {/* Product Settings */}
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Product Settings
          </button>

          {/* Export */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-2 w-10"></th>
              <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Units
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Refunds
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                COGS
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sales
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ad Spend
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Gross
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Net
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Margin
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ROI
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                BSR
              </th>
              <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
              <td className="py-4 px-2"></td>
              <td className="py-4 px-4 text-sm text-gray-900">
                Total ({filteredProducts.length} products)
              </td>
              <td className="py-4 px-4 text-right text-sm text-gray-500">-</td>
              <td className="py-4 px-4 text-right text-sm text-gray-900">
                {totals.units.toLocaleString()}
              </td>
              <td className="py-4 px-4 text-right text-sm text-red-600">
                {totals.refunds}
              </td>
              <td className="py-4 px-4 text-right text-sm text-orange-600">
                ${totals.cogs.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm text-gray-900">
                ${totals.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm text-red-600">
                ${totals.adSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm text-emerald-600">
                ${totals.grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm text-emerald-600">
                ${totals.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </td>
              <td className="py-4 px-4 text-right text-sm text-gray-900">
                {totalMargin.toFixed(1)}%
              </td>
              <td className="py-4 px-4 text-right text-sm text-gray-500">-</td>
              <td className="py-4 px-4 text-right text-sm text-gray-500">-</td>
              <td className="py-4 px-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="py-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No products found</p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  )
}
