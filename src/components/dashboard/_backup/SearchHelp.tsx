'use client'

/**
 * SearchHelp Component - "Ask Genix" Feature
 *
 * Premium search interface for dashboard help system.
 * Supports keyboard shortcuts: Cmd+K (Mac) / Ctrl+K (Windows)
 *
 * @author SellerGenix Team
 * @date December 21, 2025
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  Command,
  ArrowUp,
  ArrowDown,
  CornerDownLeft
} from 'lucide-react'
import {
  searchHelpDatabase,
  getRelatedItems,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  SOURCE_COLORS,
  type HelpItem,
  type HelpCategory
} from '@/lib/help-database'

interface SearchHelpProps {
  className?: string
}

export function SearchHelp({ className = '' }: SearchHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<HelpItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedItem, setSelectedItem] = useState<HelpItem | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Search when query changes
  useEffect(() => {
    const searchResults = searchHelpDatabase(query)
    setResults(searchResults)
    setSelectedIndex(0)
  }, [query])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      // Escape to close
      if (e.key === 'Escape') {
        if (selectedItem) {
          setSelectedItem(null)
        } else {
          setIsOpen(false)
          setQuery('')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedItem])

  // Keyboard navigation in results
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          setSelectedItem(results[selectedIndex])
        }
        break
    }
  }, [results, selectedIndex])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, results.length])

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setSelectedItem(null)
    setResults([])
  }

  const getCategoryColor = (category: HelpCategory): string => {
    switch (category) {
      case 'metrics': return 'text-blue-600 bg-blue-50'
      case 'features': return 'text-purple-600 bg-purple-50'
      case 'alerts': return 'text-amber-600 bg-amber-50'
      case 'calculations': return 'text-green-600 bg-green-50'
      case 'sections': return 'text-cyan-600 bg-cyan-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <>
      {/* Trigger Button - Premium Amazon Style with Wizard Effect */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          group relative flex items-center gap-2 px-4 py-2
          bg-gradient-to-r from-amber-500/10 to-orange-500/10
          hover:from-amber-500/20 hover:to-orange-500/20
          border border-amber-500/50 hover:border-amber-400
          rounded-lg transition-all duration-300
          text-amber-100 hover:text-white
          shadow-[0_0_15px_rgba(251,191,36,0.15)]
          hover:shadow-[0_0_25px_rgba(251,191,36,0.3)]
          overflow-hidden
          ${className}
        `}
      >
        {/* Diagonal Stripes Background */}
        <div
          className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 4px,
              rgba(251, 191, 36, 0.3) 4px,
              rgba(251, 191, 36, 0.3) 8px
            )`
          }}
        />

        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/10 to-amber-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

        {/* Wizard Icon with Sparkle */}
        <div className="relative z-10">
          <Search className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
          {/* Sparkle dots */}
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-300 rounded-full" />
        </div>

        <span className="relative z-10 text-sm font-semibold tracking-wide">Ask Genix</span>

        {/* Keyboard Shortcut Badge */}
        <div className="relative z-10 hidden sm:flex items-center gap-1 ml-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 rounded-md text-xs font-medium text-amber-300">
          <Command className="w-3 h-3" />
          <span>K</span>
        </div>

        {/* Corner Sparkles */}
        <span className="absolute top-1 right-1 w-1 h-1 bg-amber-300/60 rounded-full" />
        <span className="absolute bottom-1 left-1 w-1 h-1 bg-orange-300/60 rounded-full" />
      </button>

      {/* Modal Overlay - Fixed to viewport center */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - starts below header (top-[73px]) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[73px] left-0 right-0 bottom-0 z-[9998] bg-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal Content - Responsive positioning */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="fixed top-[100px] left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-[672px] z-[10001] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[calc(100vh-120px)]"
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700 bg-slate-800/50">
                <Search className="w-5 h-5 text-amber-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search metrics, features, calculations..."
                  className="flex-1 bg-transparent text-white text-lg placeholder:text-slate-500 outline-none"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="px-2.5 py-1 text-xs font-medium text-slate-400 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Results or Empty State */}
              <div className="max-h-[50vh] overflow-y-auto">
                {query.length < 2 ? (
                  /* Hint State */
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Lightbulb className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      What would you like to know?
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">
                      Type at least 2 characters to search
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['ACOS', 'Profit', 'ROI', 'IPI', 'Stock'].map(term => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="px-3 py-1.5 text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : results.length === 0 ? (
                  /* No Results */
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-2xl flex items-center justify-center">
                      <Search className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      No results found
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Try searching for &quot;ACOS&quot;, &quot;profit&quot;, &quot;inventory&quot;, or &quot;margin&quot;
                    </p>
                  </div>
                ) : (
                  /* Results List */
                  <div ref={resultsRef} className="py-2">
                    {results.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`
                          w-full px-4 py-3 flex items-start gap-3 text-left transition-colors
                          ${index === selectedIndex
                            ? 'bg-amber-500/10 border-l-2 border-l-amber-500'
                            : 'hover:bg-slate-800/50 border-l-2 border-l-transparent'
                          }
                        `}
                      >
                        {/* Category Icon */}
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getCategoryColor(item.category)}`}>
                          {CATEGORY_ICONS[item.category]}
                        </span>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white truncate">
                              {item.title}
                            </h4>
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${SOURCE_COLORS[item.source]}`}>
                              {item.source}
                            </span>
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with keyboard hints */}
              <div className="px-4 py-3 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    <ArrowDown className="w-3 h-3" />
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3" />
                    Select
                  </span>
                </div>
                <span className="text-amber-400/70">
                  {results.length > 0 ? `${results.length} results` : 'Type to search'}
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop - starts below header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[73px] left-0 right-0 bottom-0 z-[10002] bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedItem(null)}
            />

            {/* Detail Content - Responsive positioning */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="fixed top-[90px] left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-full sm:max-w-[512px] z-[10003] bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700 max-h-[calc(100vh-110px)] overflow-y-auto"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{CATEGORY_ICONS[selectedItem.category]}</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">
                        {CATEGORY_LABELS[selectedItem.category]}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedItem.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
                {/* Description */}
                <div className="mb-4">
                  <p className="text-slate-300 leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                {/* Details (if available) */}
                {selectedItem.details && (
                  <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {selectedItem.details}
                    </p>
                  </div>
                )}

                {/* Formula */}
                {selectedItem.formula && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Formula
                    </h4>
                    <div className="px-4 py-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <code className="text-sm font-mono text-amber-300">
                        {selectedItem.formula}
                      </code>
                    </div>
                  </div>
                )}

                {/* Example */}
                {selectedItem.example && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Example
                    </h4>
                    <div className="px-4 py-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                      <p className="text-sm text-emerald-300">
                        {selectedItem.example}
                      </p>
                    </div>
                  </div>
                )}

                {/* Good/Bad Values */}
                {(selectedItem.goodValue || selectedItem.badValue) && (
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    {selectedItem.goodValue && (
                      <div className="px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                        <span className="text-xs font-bold text-emerald-400 block mb-1">
                          ✓ Good
                        </span>
                        <span className="text-sm text-emerald-300">
                          {selectedItem.goodValue}
                        </span>
                      </div>
                    )}
                    {selectedItem.badValue && (
                      <div className="px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/30">
                        <span className="text-xs font-bold text-red-400 block mb-1">
                          ✗ Bad
                        </span>
                        <span className="text-sm text-red-300">
                          {selectedItem.badValue}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Source & Location */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${SOURCE_COLORS[selectedItem.source]}`}>
                    Source: {selectedItem.source}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-slate-800 text-slate-400 rounded border border-slate-700">
                    📍 {selectedItem.location}
                  </span>
                </div>

                {/* Tips */}
                {selectedItem.tips && selectedItem.tips.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      💡 Tips
                    </h4>
                    <ul className="space-y-2">
                      {selectedItem.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                          <span className="text-amber-500 mt-0.5">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Items */}
                {selectedItem.relatedItems && selectedItem.relatedItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                      Related Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getRelatedItems(selectedItem).map(related => (
                        <button
                          key={related.id}
                          onClick={() => setSelectedItem(related)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-medium text-slate-300 transition-colors"
                        >
                          <span>{CATEGORY_ICONS[related.category]}</span>
                          {related.title}
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-slate-800/80 border-t border-slate-700">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors shadow-lg shadow-amber-500/20"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
