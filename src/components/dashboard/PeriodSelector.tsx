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

// =============================================
// PST TIMEZONE HELPERS
// Amazon US marketplace uses PST (UTC-8) for daily boundaries
// CRITICAL: All date ranges must be PST-aligned for accurate data
// =============================================

/**
 * Get today's date in PST timezone
 * This returns the calendar date (year, month, day) as it currently is in PST
 */
function getPSTToday(): { year: number; month: number; day: number } {
  const now = new Date()
  // Convert UTC to PST by subtracting 8 hours
  const pstTime = new Date(now.getTime() - 8 * 60 * 60 * 1000)
  return {
    year: pstTime.getUTCFullYear(),
    month: pstTime.getUTCMonth(),
    day: pstTime.getUTCDate()
  }
}

/**
 * Create a Date object representing a specific day in PST
 * CRITICAL: Must use Date.UTC to avoid timezone issues!
 * When toISOString() is called, it returns the correct YYYY-MM-DD
 */
function createPSTDate(year: number, month: number, day: number): Date {
  // CRITICAL FIX: Use Date.UTC to create the date
  // This ensures toISOString().split('T')[0] returns the correct date string
  // regardless of the user's browser timezone
  //
  // Example without fix (user in Turkey, UTC+3):
  //   new Date(2026, 0, 21) = Jan 21 00:00 Turkey = Jan 20 21:00 UTC
  //   toISOString() = "2026-01-20T21:00:00.000Z" → split = "2026-01-20" ❌
  //
  // With fix:
  //   new Date(Date.UTC(2026, 0, 21)) = Jan 21 00:00 UTC
  //   toISOString() = "2026-01-21T00:00:00.000Z" → split = "2026-01-21" ✅
  return new Date(Date.UTC(year, month, day))
}

/**
 * Get day of week in PST (0=Sunday, 1=Monday, etc.)
 * CRITICAL: Use UTC methods for dates created with Date.UTC
 */
function getPSTDayOfWeek(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month, day)).getUTCDay()
}

/**
 * Add days to a PST date (using UTC internally)
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime())
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

/**
 * Get days in a month (1-based)
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

// Helper function to get date ranges (PST-aware)
// CRITICAL: All operations must use UTC methods!
const getDateRange = (type: string): { startDate: Date; endDate: Date } => {
  const pst = getPSTToday()
  const today = createPSTDate(pst.year, pst.month, pst.day)
  const todayDayOfWeek = today.getUTCDay() // 0=Sunday, 1=Monday, etc.

  switch (type) {
    case 'today':
      return { startDate: today, endDate: today }

    case 'yesterday':
      const yesterday = addDays(today, -1)
      return { startDate: yesterday, endDate: yesterday }

    case 'this-week':
      const weekStart = addDays(today, -todayDayOfWeek)
      return { startDate: weekStart, endDate: today }

    case 'last-week':
      const lastWeekEnd = addDays(today, -todayDayOfWeek - 1)
      const lastWeekStart = addDays(lastWeekEnd, -6)
      return { startDate: lastWeekStart, endDate: lastWeekEnd }

    case 'this-month':
      return {
        startDate: createPSTDate(pst.year, pst.month, 1),
        endDate: today
      }

    case 'last-month': {
      const lastMonth = pst.month === 0 ? 11 : pst.month - 1
      const lastMonthYear = pst.month === 0 ? pst.year - 1 : pst.year
      const daysInLastMonth = getDaysInMonth(lastMonthYear, lastMonth)
      return {
        startDate: createPSTDate(lastMonthYear, lastMonth, 1),
        endDate: createPSTDate(lastMonthYear, lastMonth, daysInLastMonth)
      }
    }

    case '7-days-ago':
      const sevenDaysAgo = addDays(today, -7)
      return { startDate: sevenDaysAgo, endDate: sevenDaysAgo }

    case '14-days-ago':
      const fourteenDaysAgo = addDays(today, -14)
      return { startDate: fourteenDaysAgo, endDate: fourteenDaysAgo }

    case '30-days-ago':
      const thirtyDaysAgo = addDays(today, -30)
      return { startDate: thirtyDaysAgo, endDate: thirtyDaysAgo }

    case '2-weeks-ago': {
      const twoWeeksAgoEnd = addDays(today, -todayDayOfWeek - 8)
      const twoWeeksAgoStart = addDays(twoWeeksAgoEnd, -6)
      return { startDate: twoWeeksAgoStart, endDate: twoWeeksAgoEnd }
    }

    case '4-weeks-ago': {
      const fourWeeksAgoEnd = addDays(today, -todayDayOfWeek - 22)
      const fourWeeksAgoStart = addDays(fourWeeksAgoEnd, -6)
      return { startDate: fourWeeksAgoStart, endDate: fourWeeksAgoEnd }
    }

    case '2-months-ago': {
      const twoMonthsAgo = pst.month < 2
        ? { year: pst.year - 1, month: pst.month + 10 }
        : { year: pst.year, month: pst.month - 2 }
      const daysInTwoMonthsAgo = getDaysInMonth(twoMonthsAgo.year, twoMonthsAgo.month)
      return {
        startDate: createPSTDate(twoMonthsAgo.year, twoMonthsAgo.month, 1),
        endDate: createPSTDate(twoMonthsAgo.year, twoMonthsAgo.month, daysInTwoMonthsAgo)
      }
    }

    case '3-months-ago': {
      const threeMonthsAgo = pst.month < 3
        ? { year: pst.year - 1, month: pst.month + 9 }
        : { year: pst.year, month: pst.month - 3 }
      const daysInThreeMonthsAgo = getDaysInMonth(threeMonthsAgo.year, threeMonthsAgo.month)
      return {
        startDate: createPSTDate(threeMonthsAgo.year, threeMonthsAgo.month, 1),
        endDate: createPSTDate(threeMonthsAgo.year, threeMonthsAgo.month, daysInThreeMonthsAgo)
      }
    }

    case 'this-quarter': {
      const quarterMonth = Math.floor(pst.month / 3) * 3
      return {
        startDate: createPSTDate(pst.year, quarterMonth, 1),
        endDate: today
      }
    }

    case 'last-quarter': {
      let lastQuarterMonth = Math.floor(pst.month / 3) * 3 - 3
      let lastQuarterYear = pst.year
      if (lastQuarterMonth < 0) {
        lastQuarterMonth += 12
        lastQuarterYear -= 1
      }
      const lastQuarterEndMonth = lastQuarterMonth + 2
      const daysInLastQuarterEnd = getDaysInMonth(lastQuarterYear, lastQuarterEndMonth)
      return {
        startDate: createPSTDate(lastQuarterYear, lastQuarterMonth, 1),
        endDate: createPSTDate(lastQuarterYear, lastQuarterEndMonth, daysInLastQuarterEnd)
      }
    }

    case 'ytd':
      return {
        startDate: createPSTDate(pst.year, 0, 1),
        endDate: today
      }

    case 'last-year-ytd':
      return {
        startDate: createPSTDate(pst.year - 1, 0, 1),
        endDate: createPSTDate(pst.year - 1, pst.month, pst.day)
      }

    case 'same-month-last-year': {
      const daysInSameMonthLastYear = getDaysInMonth(pst.year - 1, pst.month)
      return {
        startDate: createPSTDate(pst.year - 1, pst.month, 1),
        endDate: createPSTDate(pst.year - 1, pst.month, daysInSameMonthLastYear)
      }
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
