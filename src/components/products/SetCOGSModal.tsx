'use client'

/**
 * Set COGS Modal
 * Configure cost of goods sold for products
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Calendar, Info, History, Plus, Trash2 } from 'lucide-react'
import { Toast } from '@/components/ui/Toast'
import { updateProductCOGSAction, addCOGSHistoryAction } from '@/app/actions/cogs-actions'

interface SetCOGSModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onSuccess?: () => void // Callback after successful save
}

export function SetCOGSModal({ isOpen, onClose, product, onSuccess }: SetCOGSModalProps) {
  const [cogsType, setCOGSType] = useState<'constant' | 'period-based'>('constant')
  const [constantCOGS, setConstantCOGS] = useState('')
  const [periodBasedCOGS, setPeriodBasedCOGS] = useState([
    { startDate: '', endDate: '', cogs: '', notes: '' }
  ])
  const [saving, setSaving] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{
    isOpen: boolean
    type: 'success' | 'error'
    title: string
    message?: string
  }>({
    isOpen: false,
    type: 'success',
    title: ''
  })

  // Initialize with existing COGS if available
  useEffect(() => {
    if (product.cogs !== null) {
      setConstantCOGS(product.cogs.toString())
      setCOGSType('constant')
    }
  }, [product])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const addPeriodEntry = () => {
    setPeriodBasedCOGS([
      ...periodBasedCOGS,
      { startDate: '', endDate: '', cogs: '', notes: '' }
    ])
  }

  const removePeriodEntry = (index: number) => {
    setPeriodBasedCOGS(periodBasedCOGS.filter((_, i) => i !== index))
  }

  const updatePeriodEntry = (index: number, field: string, value: string) => {
    const updated = [...periodBasedCOGS]
    updated[index] = { ...updated[index], [field]: value }
    setPeriodBasedCOGS(updated)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      if (cogsType === 'constant') {
        // Save constant COGS
        const result = await updateProductCOGSAction(
          product.id,
          parseFloat(constantCOGS),
          'constant'
        )

        if (!result.success) {
          setToast({
            isOpen: true,
            type: 'error',
            title: 'Save Failed',
            message: result.error || 'There was an error saving COGS. Please try again.'
          })
          setSaving(false)
          return
        }

        setToast({
          isOpen: true,
          type: 'success',
          title: 'COGS Saved Successfully!',
          message: `Constant COGS of $${parseFloat(constantCOGS).toFixed(2)} has been saved for ${product.title}`
        })
      } else {
        // Save period-based COGS
        // First set type to period-based
        const result = await updateProductCOGSAction(
          product.id,
          parseFloat(periodBasedCOGS[0].cogs), // Use first period as default
          'period-based'
        )

        if (!result.success) {
          setToast({
            isOpen: true,
            type: 'error',
            title: 'Save Failed',
            message: result.error || 'There was an error updating COGS type. Please try again.'
          })
          setSaving(false)
          return
        }

        // Then save all period entries
        for (const entry of periodBasedCOGS) {
          if (entry.startDate && entry.cogs) {
            const historyResult = await addCOGSHistoryAction(
              product.id,
              entry.startDate,
              parseFloat(entry.cogs),
              entry.endDate || null,
              entry.notes || null
            )

            if (!historyResult.success) {
              setToast({
                isOpen: true,
                type: 'error',
                title: 'Save Failed',
                message: historyResult.error || 'There was an error saving COGS history. Please try again.'
              })
              setSaving(false)
              return
            }
          }
        }

        setToast({
          isOpen: true,
          type: 'success',
          title: 'COGS History Saved!',
          message: `${periodBasedCOGS.length} period(s) have been saved successfully`
        })
      }

      // Wait 1.5 seconds to show toast, then close modal and refresh
      setTimeout(() => {
        onClose()
        if (onSuccess) {
          onSuccess() // Trigger parent refresh
        }
      }, 1500)

    } catch (error) {
      console.error('Error saving COGS:', error)
      setToast({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: 'There was an error saving COGS. Please try again.'
      })
    } finally {
      setSaving(false)
    }
  }

  const isValid = () => {
    if (cogsType === 'constant') {
      return constantCOGS && !isNaN(parseFloat(constantCOGS)) && parseFloat(constantCOGS) > 0
    } else {
      return periodBasedCOGS.every(entry =>
        entry.startDate && entry.cogs && !isNaN(parseFloat(entry.cogs)) && parseFloat(entry.cogs) > 0
      )
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb] sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-black text-[#343a40]">Set Cost of Goods (COGS)</h2>
                  <p className="text-sm text-[#6c757d] mt-1">{product.title}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-[#f8f9fa] transition-colors"
                >
                  <X className="w-6 h-6 text-[#6c757d]" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Product Info */}
                <div className="bg-[#f8f9fa] rounded-xl p-4 mb-6">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[#6c757d] font-semibold mb-1">ASIN</p>
                      <p className="font-bold text-[#343a40]">{product.asin}</p>
                    </div>
                    <div>
                      <p className="text-[#6c757d] font-semibold mb-1">Current Price</p>
                      <p className="font-bold text-[#343a40]">${product.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[#6c757d] font-semibold mb-1">FBA Stock</p>
                      <p className="font-bold text-[#343a40]">{product.fba_stock} units</p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-[#4285f4]/10 border-2 border-[#4285f4]/30 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#4285f4] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[#343a40]">
                      <p className="font-bold mb-1">What is COGS?</p>
                      <p>Cost of Goods Sold (COGS) is what YOU paid to your supplier for this product, including shipping to you. This is essential for accurate profit calculation.</p>
                    </div>
                  </div>
                </div>

                {/* COGS Type Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-[#343a40] mb-3">
                    COGS Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setCOGSType('constant')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        cogsType === 'constant'
                          ? 'border-[#4285f4] bg-[#4285f4]/10'
                          : 'border-[#e5e7eb] hover:border-[#4285f4]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          cogsType === 'constant'
                            ? 'bg-gradient-to-br from-[#4285f4] to-[#3367d6]'
                            : 'bg-[#f8f9fa]'
                        }`}>
                          <DollarSign className={`w-5 h-5 ${cogsType === 'constant' ? 'text-white' : 'text-[#6c757d]'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-[#343a40]">Constant</p>
                          <p className="text-xs text-[#6c757d]">Single fixed value</p>
                        </div>
                      </div>
                      <p className="text-xs text-[#6c757d]">
                        Use this if your cost is always the same
                      </p>
                    </button>

                    <button
                      onClick={() => setCOGSType('period-based')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        cogsType === 'period-based'
                          ? 'border-[#4285f4] bg-[#4285f4]/10'
                          : 'border-[#e5e7eb] hover:border-[#4285f4]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          cogsType === 'period-based'
                            ? 'bg-gradient-to-br from-[#4285f4] to-[#3367d6]'
                            : 'bg-[#f8f9fa]'
                        }`}>
                          <History className={`w-5 h-5 ${cogsType === 'period-based' ? 'text-white' : 'text-[#6c757d]'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-[#343a40]">Period-Based</p>
                          <p className="text-xs text-[#6c757d]">Track cost changes</p>
                        </div>
                      </div>
                      <p className="text-xs text-[#6c757d]">
                        For costs that change over time
                      </p>
                    </button>
                  </div>
                </div>

                {/* Constant COGS Input */}
                {cogsType === 'constant' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-[#343a40] mb-2">
                        Unit Cost ($)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6c757d]" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={constantCOGS}
                          onChange={(e) => setConstantCOGS(e.target.value)}
                          placeholder="15.00"
                          className="w-full pl-12 pr-4 py-4 border-2 border-[#e5e7eb] rounded-xl font-bold text-xl text-[#343a40] placeholder:text-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:border-[#4285f4] transition-all"
                        />
                      </div>
                      <p className="text-xs text-[#6c757d] mt-2">
                        Example: If you bought 1000 units for $15,000 total, enter $15.00
                      </p>
                    </div>

                    {/* Preview Calculation */}
                    {constantCOGS && !isNaN(parseFloat(constantCOGS)) && (
                      <div className="bg-[#34a853]/10 border-2 border-[#34a853]/30 rounded-xl p-4">
                        <p className="text-sm font-bold text-[#343a40] mb-2">Preview Calculation</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[#6c757d]">Current Price:</span>
                            <span className="font-bold text-[#343a40]">${product.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6c757d]">Your Cost:</span>
                            <span className="font-bold text-[#ea4335]">-${parseFloat(constantCOGS).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t border-[#34a853]/30 pt-2 mt-2">
                            <span className="text-[#343a40] font-bold">Gross Margin:</span>
                            <span className="font-black text-[#34a853]">
                              ${(product.price - parseFloat(constantCOGS)).toFixed(2)}
                              ({(((product.price - parseFloat(constantCOGS)) / product.price) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-[#6c757d] mt-3">
                          * This doesn't include Amazon fees, shipping, or advertising costs yet
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Period-Based COGS Input */}
                {cogsType === 'period-based' && (
                  <div className="space-y-4">
                    {periodBasedCOGS.map((entry, index) => (
                      <div key={index} className="bg-[#f8f9fa] rounded-xl p-4 relative">
                        {periodBasedCOGS.length > 1 && (
                          <button
                            onClick={() => removePeriodEntry(index)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-[#ea4335]/10 text-[#ea4335] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <p className="text-sm font-bold text-[#343a40] mb-3">Period {index + 1}</p>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-bold text-[#6c757d] mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={entry.startDate}
                              onChange={(e) => updatePeriodEntry(index, 'startDate', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-[#e5e7eb] rounded-lg font-semibold text-sm text-[#343a40] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:border-[#4285f4] transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-[#6c757d] mb-1">
                              End Date (Optional)
                            </label>
                            <input
                              type="date"
                              value={entry.endDate}
                              onChange={(e) => updatePeriodEntry(index, 'endDate', e.target.value)}
                              className="w-full px-3 py-2 border-2 border-[#e5e7eb] rounded-lg font-semibold text-sm text-[#343a40] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:border-[#4285f4] transition-all"
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-bold text-[#6c757d] mb-1">
                            Unit Cost ($)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={entry.cogs}
                            onChange={(e) => updatePeriodEntry(index, 'cogs', e.target.value)}
                            placeholder="15.00"
                            className="w-full px-3 py-2 border-2 border-[#e5e7eb] rounded-lg font-bold text-sm text-[#343a40] placeholder:text-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:border-[#4285f4] transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#6c757d] mb-1">
                            Notes (Optional)
                          </label>
                          <input
                            type="text"
                            value={entry.notes}
                            onChange={(e) => updatePeriodEntry(index, 'notes', e.target.value)}
                            placeholder="e.g., New supplier deal"
                            className="w-full px-3 py-2 border-2 border-[#e5e7eb] rounded-lg font-semibold text-sm text-[#343a40] placeholder:text-[#6c757d] focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:border-[#4285f4] transition-all"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={addPeriodEntry}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[#4285f4] rounded-xl font-bold text-[#4285f4] hover:bg-[#4285f4]/10 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                      Add Another Period
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-4 p-6 border-t border-[#e5e7eb] bg-[#f8f9fa]">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 py-3 border-2 border-[#e5e7eb] rounded-xl font-bold text-[#6c757d] hover:border-[#ea4335] hover:text-[#ea4335] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isValid() || saving}
                  className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                    isValid() && !saving
                      ? 'bg-gradient-to-r from-[#4285f4] to-[#34a853] text-white hover:shadow-xl'
                      : 'bg-[#e5e7eb] text-[#6c757d] cursor-not-allowed'
                  }`}
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {saving ? 'Saving...' : 'Save COGS'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Toast Notification */}
          <Toast
            isOpen={toast.isOpen}
            onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={3000}
          />
        </>
      )}
    </AnimatePresence>
  )
}
