'use client'

/**
 * Toast Notification Component
 * Professional animated notifications
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

interface ToastProps {
  isOpen: boolean
  onClose: () => void
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number // milliseconds
}

export function Toast({
  isOpen,
  onClose,
  type,
  title,
  message,
  duration = 3000
}: ToastProps) {
  // Auto-close after duration
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  const config = {
    success: {
      icon: CheckCircle,
      gradient: 'from-[#34a853] to-[#137333]',
      bg: 'bg-[#34a853]/10',
      border: 'border-[#34a853]/30',
      iconColor: 'text-[#34a853]'
    },
    error: {
      icon: XCircle,
      gradient: 'from-[#ea4335] to-[#c5221f]',
      bg: 'bg-[#ea4335]/10',
      border: 'border-[#ea4335]/30',
      iconColor: 'text-[#ea4335]'
    },
    warning: {
      icon: AlertTriangle,
      gradient: 'from-[#fbbc05] to-[#f29900]',
      bg: 'bg-[#fbbc05]/10',
      border: 'border-[#fbbc05]/30',
      iconColor: 'text-[#fbbc05]'
    },
    info: {
      icon: Info,
      gradient: 'from-[#4285f4] to-[#3367d6]',
      bg: 'bg-[#4285f4]/10',
      border: 'border-[#4285f4]/30',
      iconColor: 'text-[#4285f4]'
    }
  }

  const Icon = config[type].icon

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto"
          >
            <div className={`
              ${config[type].bg}
              ${config[type].border}
              border-2 rounded-2xl shadow-2xl backdrop-blur-sm
              min-w-[320px] max-w-md
              p-4
            `}>
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`
                  w-10 h-10 flex-shrink-0 rounded-xl
                  bg-gradient-to-br ${config[type].gradient}
                  flex items-center justify-center
                `}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[#343a40] mb-1">
                    {title}
                  </h4>
                  {message && (
                    <p className="text-sm text-[#6c757d]">
                      {message}
                    </p>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <X className="w-4 h-4 text-[#6c757d]" />
                </button>
              </div>

              {/* Progress bar */}
              {duration > 0 && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: duration / 1000, ease: 'linear' }}
                  className={`h-1 mt-3 rounded-full bg-gradient-to-r ${config[type].gradient}`}
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/**
 * Simple toast hook for easy usage
 */
export function useToast() {
  const [toastState, setToastState] = useState<{
    isOpen: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
  }>({
    isOpen: false,
    type: 'success',
    title: ''
  })

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message?: string
  ) => {
    setToastState({ isOpen: true, type, title, message })
  }

  const hideToast = () => {
    setToastState(prev => ({ ...prev, isOpen: false }))
  }

  return { toastState, showToast, hideToast }
}
