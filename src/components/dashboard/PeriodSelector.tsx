'use client'

import React, { useState } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'

export interface PeriodSet {
  id: string
  name: string
  periods: {
    label: string
    startDate: Date
    endDate: Date
  }[]
}

// Helper function to get date ranges
const getDateRange = (type: string): { startDate: Date; endDate: Date } => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (type) {
    case 'today':
      return { startDate: today, endDate: today }
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { startDate: yesterday, endDate: yesterday }
    case 'this-week':
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      return { startDate: weekStart, endDate: today }
    case 'last-week':
      const lastWeekEnd = new Date(today)
      lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay() - 1)
      const lastWeekStart = new Date(lastWeekEnd)
      lastWeekStart.setDate(lastWeekStart.getDate() - 6)
      return { startDate: lastWeekStart, endDate: lastWeekEnd }
    case 'this-month':
      return { startDate: new Date(today.getFullYear(), today.getMonth(), 1), endDate: today }
    case 'last-month':
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      return { startDate: lastMonthStart, endDate: lastMonthEnd }
    case '7-days-ago':
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return { startDate: sevenDaysAgo, endDate: sevenDaysAgo }
    case '14-days-ago':
      const fourteenDaysAgo = new Date(today)
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      return { startDate: fourteenDaysAgo, endDate: fourteenDaysAgo }
    case '30-days-ago':
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return { startDate: thirtyDaysAgo, endDate: thirtyDaysAgo }
    case '2-weeks-ago':
      const twoWeeksAgoEnd = new Date(today)
      twoWeeksAgoEnd.setDate(twoWeeksAgoEnd.getDate() - twoWeeksAgoEnd.getDay() - 8)
      const twoWeeksAgoStart = new Date(twoWeeksAgoEnd)
      twoWeeksAgoStart.setDate(twoWeeksAgoStart.getDate() - 6)
      return { startDate: twoWeeksAgoStart, endDate: twoWeeksAgoEnd }
    case '4-weeks-ago':
      const fourWeeksAgoEnd = new Date(today)
      fourWeeksAgoEnd.setDate(fourWeeksAgoEnd.getDate() - fourWeeksAgoEnd.getDay() - 22)
      const fourWeeksAgoStart = new Date(fourWeeksAgoEnd)
      fourWeeksAgoStart.setDate(fourWeeksAgoStart.getDate() - 6)
      return { startDate: fourWeeksAgoStart, endDate: fourWeeksAgoEnd }
    case '2-months-ago':
      const twoMonthsAgoEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0)
      const twoMonthsAgoStart = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      return { startDate: twoMonthsAgoStart, endDate: twoMonthsAgoEnd }
    case '3-months-ago':
      const threeMonthsAgoEnd = new Date(today.getFullYear(), today.getMonth() - 2, 0)
      const threeMonthsAgoStart = new Date(today.getFullYear(), today.getMonth() - 3, 1)
      return { startDate: threeMonthsAgoStart, endDate: threeMonthsAgoEnd }
    case 'this-quarter':
      const quarterMonth = Math.floor(today.getMonth() / 3) * 3
      return { startDate: new Date(today.getFullYear(), quarterMonth, 1), endDate: today }
    case 'last-quarter':
      const lastQuarterMonth = Math.floor(today.getMonth() / 3) * 3 - 3
      const lastQuarterYear = lastQuarterMonth < 0 ? today.getFullYear() - 1 : today.getFullYear()
      const adjustedMonth = lastQuarterMonth < 0 ? lastQuarterMonth + 12 : lastQuarterMonth
      return {
        startDate: new Date(lastQuarterYear, adjustedMonth, 1),
        endDate: new Date(lastQuarterYear, adjustedMonth + 3, 0)
      }
    case 'ytd':
      return { startDate: new Date(today.getFullYear(), 0, 1), endDate: today }
    case 'last-year-ytd':
      return {
        startDate: new Date(today.getFullYear() - 1, 0, 1),
        endDate: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
      }
    case 'same-month-last-year':
      return {
        startDate: new Date(today.getFullYear() - 1, today.getMonth(), 1),
        endDate: new Date(today.getFullYear() - 1, today.getMonth() + 1, 0)
      }
    default:
      return { startDate: today, endDate: today }
  }
}

const PERIOD_SETS: PeriodSet[] = [
  {
    id: 'default',
    name: 'Default',
    periods: [
      { label: 'Today', ...getDateRange('today') },
      { label: 'Yesterday', ...getDateRange('yesterday') },
      { label: 'This Month', ...getDateRange('this-month') },
      { label: 'Last Month', ...getDateRange('last-month') },
    ]
  },
  {
    id: 'daily',
    name: 'Daily Trend',
    periods: [
      { label: 'Today', ...getDateRange('today') },
      { label: '7 Days Ago', ...getDateRange('7-days-ago') },
      { label: '14 Days Ago', ...getDateRange('14-days-ago') },
      { label: '30 Days Ago', ...getDateRange('30-days-ago') },
    ]
  },
  {
    id: 'weekly',
    name: 'Weekly',
    periods: [
      { label: 'This Week', ...getDateRange('this-week') },
      { label: 'Last Week', ...getDateRange('last-week') },
      { label: '2 Weeks Ago', ...getDateRange('2-weeks-ago') },
      { label: '4 Weeks Ago', ...getDateRange('4-weeks-ago') },
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly',
    periods: [
      { label: 'This Month', ...getDateRange('this-month') },
      { label: 'Last Month', ...getDateRange('last-month') },
      { label: '2 Months Ago', ...getDateRange('2-months-ago') },
      { label: '3 Months Ago', ...getDateRange('3-months-ago') },
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    periods: [
      { label: 'This Quarter', ...getDateRange('this-quarter') },
      { label: 'Last Quarter', ...getDateRange('last-quarter') },
      { label: 'Q3', ...getDateRange('3-months-ago') },
      { label: 'Q4 Last Year', ...getDateRange('last-quarter') },
    ]
  },
  {
    id: 'yoy',
    name: 'Year over Year',
    periods: [
      { label: 'This Month', ...getDateRange('this-month') },
      { label: 'Same Month LY', ...getDateRange('same-month-last-year') },
      { label: 'YTD', ...getDateRange('ytd') },
      { label: 'Last Year YTD', ...getDateRange('last-year-ytd') },
    ]
  }
]

interface PeriodSelectorProps {
  selectedSetId: string
  onSetChange: (setId: string) => void
  customRange: { start: Date | null; end: Date | null }
  onCustomRangeChange: (range: { start: Date | null; end: Date | null }) => void
  isCustomMode: boolean
  onCustomModeChange: (isCustom: boolean) => void
}

export default function PeriodSelector({
  selectedSetId,
  onSetChange,
  customRange,
  onCustomRangeChange,
  isCustomMode,
  onCustomModeChange
}: PeriodSelectorProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  const formatDate = (date: Date | null) => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Period Set Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-gray-500" />
        <div className="flex items-center flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
          {PERIOD_SETS.map(set => (
            <button
              key={set.id}
              onClick={() => {
                onSetChange(set.id)
                onCustomModeChange(false)
              }}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${selectedSetId === set.id && !isCustomMode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {set.name}
            </button>
          ))}
          <button
            onClick={() => {
              onCustomModeChange(true)
              setShowCustomPicker(true)
            }}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${isCustomMode
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            Custom
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {isCustomMode && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={formatDate(customRange.start)}
              onChange={(e) => onCustomRangeChange({
                ...customRange,
                start: e.target.value ? new Date(e.target.value) : null
              })}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <span className="text-gray-400">→</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={formatDate(customRange.end)}
              onChange={(e) => onCustomRangeChange({
                ...customRange,
                end: e.target.value ? new Date(e.target.value) : null
              })}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              onCustomModeChange(false)
              onCustomRangeChange({ start: null, end: null })
            }}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export { PERIOD_SETS, getDateRange }
