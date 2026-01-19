'use client'

import React from 'react'
import PeriodCard, { PeriodData } from './PeriodCard'

interface PeriodCardsGridProps {
  periods: PeriodData[]
  selectedIndex: number
  onSelectPeriod: (index: number) => void
  onMoreClick: (index: number) => void
  isCustomMode?: boolean
}

export default function PeriodCardsGrid({
  periods,
  selectedIndex,
  onSelectPeriod,
  onMoreClick,
  isCustomMode = false
}: PeriodCardsGridProps) {
  // In custom mode, show only 1 card (full width)
  // In normal mode, show 4 cards in a grid

  if (isCustomMode && periods.length === 1) {
    return (
      <div className="max-w-xl">
        <PeriodCard
          data={periods[0]}
          isSelected={true}
          onClick={() => onSelectPeriod(0)}
          onMoreClick={() => onMoreClick(0)}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {periods.map((period, index) => (
        <PeriodCard
          key={`${period.label}-${index}`}
          data={period}
          isSelected={selectedIndex === index}
          onClick={() => onSelectPeriod(index)}
          onMoreClick={() => onMoreClick(index)}
        />
      ))}
    </div>
  )
}
