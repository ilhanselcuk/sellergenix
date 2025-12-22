'use client'

/**
 * Fee Tooltip Component
 * Shows detailed explanations for Amazon fee items
 * Used throughout dashboard to explain cost breakdowns
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle } from 'lucide-react'

interface FeeTooltipProps {
  title: string
  description: string
  calculation?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function FeeTooltip({
  title,
  description,
  calculation,
  side = 'top',
  className = '',
}: FeeTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Position classes based on side prop
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  // Arrow position based on side
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[#343a40]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[#343a40]',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[#343a40]',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[#343a40]',
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger button */}
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#4285f4]/10 transition-colors cursor-help"
        type="button"
        aria-label={`Info about ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5 text-[#6c757d] hover:text-[#4285f4] transition-colors" />
      </button>

      {/* Tooltip popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 4 : -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 ${positionClasses[side]} pointer-events-none`}
          >
            <div className="bg-[#343a40] text-white rounded-xl shadow-2xl p-4 min-w-[280px] max-w-[380px]">
              {/* Title */}
              <h4 className="font-bold text-sm mb-2">{title}</h4>

              {/* Description */}
              <p className="text-xs text-gray-300 leading-relaxed mb-2">
                {description}
              </p>

              {/* Calculation formula if provided */}
              {calculation && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-[10px] font-semibold text-[#4285f4] mb-1">
                    CALCULATION:
                  </p>
                  <code className="text-[10px] font-mono text-[#fbbc05] bg-black/30 px-2 py-1 rounded block">
                    {calculation}
                  </code>
                </div>
              )}
            </div>

            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-[6px] ${arrowClasses[side]}`}
              style={{ borderStyle: 'solid' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Simplified inline version for tight spaces
 */
export function FeeTooltipInline({ title, description }: { title: string; description: string }) {
  return (
    <FeeTooltip
      title={title}
      description={description}
      side="top"
      className="ml-1.5"
    />
  )
}
