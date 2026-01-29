'use client'

import React from 'react'

// Starbucks Color Palette
const STARBUCKS = {
  primaryGreen: '#00704A',
  darkGreen: '#1E3932',
  lightGreen: '#D4E9E2',
  gold: '#CBA258',
  cream: '#F2F0EB',
  white: '#FFFFFF',
}

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
// =============================================

function getPSTToday(): { year: number; month: number; day: number } {
  const now = new Date()
  const pstTime = new Date(now.getTime() - 8 * 60 * 60 * 1000)
  return {
    year: pstTime.getUTCFullYear(),
    month: pstTime.getUTCMonth(),
    day: pstTime.getUTCDate()
  }
}

function createPSTDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day))
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

// Get date ranges for default periods only
const getDateRange = (type: string): { startDate: Date; endDate: Date } => {
  const pst = getPSTToday()
  const today = createPSTDate(pst.year, pst.month, pst.day)

  switch (type) {
    case 'today':
      return { startDate: today, endDate: today }

    case 'yesterday':
      const yesterday = new Date(today.getTime())
      yesterday.setUTCDate(yesterday.getUTCDate() - 1)
      return { startDate: yesterday, endDate: yesterday }

    // 2 days ago - for Yesterday comparison (PST timezone aware)
    case 'two-days-ago': {
      const twoDaysAgo = new Date(today.getTime())
      twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2)
      return { startDate: twoDaysAgo, endDate: twoDaysAgo }
    }

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

    // 2 months ago - for Last Month comparison (PST timezone aware)
    case 'two-months-ago': {
      let twoMonthsAgo = pst.month - 2
      let twoMonthsAgoYear = pst.year
      if (twoMonthsAgo < 0) {
        twoMonthsAgo += 12
        twoMonthsAgoYear -= 1
      }
      const daysInTwoMonthsAgo = getDaysInMonth(twoMonthsAgoYear, twoMonthsAgo)
      return {
        startDate: createPSTDate(twoMonthsAgoYear, twoMonthsAgo, 1),
        endDate: createPSTDate(twoMonthsAgoYear, twoMonthsAgo, daysInTwoMonthsAgo)
      }
    }

    default:
      return { startDate: today, endDate: today }
  }
}

// Only Default period set - Today, Yesterday, This Month, Last Month
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
  }
]

interface PeriodSelectorProps {
  selectedSetId?: string
  onSetChange?: (setId: string) => void
}

// Component returns null since there's only one period set (Default)
// No UI needed - periods are automatically used
export default function PeriodSelector(_props: PeriodSelectorProps) {
  return null
}

export { PERIOD_SETS, getDateRange }
