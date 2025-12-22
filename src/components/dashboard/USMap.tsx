'use client'

/**
 * Interactive US Map Component
 * Shows sales/stock data by state with color intensity
 */

import { useState } from 'react'

interface USMapProps {
  data: { [stateCode: string]: number }
  mode: 'sales' | 'stock'
  onStateClick?: (stateCode: string) => void
}

// US States with simplified SVG paths and positions
const US_STATES = {
  CA: { name: 'California', path: 'M100,200 L100,100 L200,100 L200,250 Z' },
  TX: { name: 'Texas', path: 'M350,280 L350,200 L480,200 L480,320 Z' },
  FL: { name: 'Florida', path: 'M650,300 L680,280 L720,320 L700,360 Z' },
  NY: { name: 'New York', path: 'M750,80 L800,80 L800,120 L750,120 Z' },
  // Diğer state'leri de ekleyeceğiz...
}

export function USMap({ data, mode, onStateClick }: USMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null)

  // Get max value for color scaling
  const maxValue = Math.max(...Object.values(data), 1)

  const getStateColor = (stateCode: string) => {
    const value = data[stateCode] || 0
    const intensity = Math.min((value / maxValue) * 100, 100)

    if (intensity === 0) return '#e5e7eb' // Gray for no data

    // Blue gradient based on intensity
    const blue = Math.round(66 + (intensity / 100) * 189) // 66-255
    return `rgb(${255 - blue}, ${255 - blue * 0.8}, 255)`
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
      {/* Map Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <svg
          viewBox="0 0 900 500"
          className="w-full h-full"
          style={{ maxHeight: '500px' }}
        >
          {Object.entries(US_STATES).map(([code, state]) => (
            <g key={code}>
              <path
                d={state.path}
                fill={getStateColor(code)}
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-200 cursor-pointer hover:opacity-80"
                onMouseEnter={() => setHoveredState(code)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => onStateClick?.(code)}
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredState && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-semibold pointer-events-none">
            <div className="flex items-center gap-2">
              <span>{US_STATES[hoveredState as keyof typeof US_STATES].name}</span>
              <span className="text-blue-400">
                {mode === 'sales'
                  ? `$${(data[hoveredState] || 0).toLocaleString()}`
                  : `${(data[hoveredState] || 0).toLocaleString()} units`
                }
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
          {mode === 'sales' ? 'Sales' : 'Stock'}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Less</span>
          <div className="flex gap-1">
            {[0, 20, 40, 60, 80, 100].map((intensity) => {
              const blue = Math.round(66 + (intensity / 100) * 189)
              return (
                <div
                  key={intensity}
                  className="w-6 h-4 rounded"
                  style={{ backgroundColor: `rgb(${255 - blue}, ${255 - blue * 0.8}, 255)` }}
                />
              )
            })}
          </div>
          <span className="text-xs text-gray-500">More</span>
        </div>
      </div>
    </div>
  )
}
