'use client'

/**
 * Auth Modal Component - SellerGenix
 * Login and Register Modal with Framer Motion animations
 */

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Suspense } from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'register'
  onSwitchMode: (mode: 'login' | 'register') => void
}

export function AuthModal({ isOpen, onClose, mode, onSwitchMode }: AuthModalProps) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

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
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-[#6c757d]" />
              </button>

              {/* Modal Content */}
              <div className="p-8 max-h-[90vh] overflow-y-auto">
                {mode === 'login' ? (
                  <>
                    {/* Login Header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#4285f4] to-[#34a853] rounded-xl flex items-center justify-center">
                          <span className="text-2xl font-black text-white">SG</span>
                        </div>
                        <span className="text-2xl font-black text-[#343a40]">SellerGenix</span>
                      </div>
                      <h2 className="text-3xl font-black text-[#343a40] text-center mb-2">
                        Welcome Back
                      </h2>
                      <p className="text-[#6c757d] text-center">
                        Sign in to your account to continue
                      </p>
                    </div>

                    {/* Login Form */}
                    <Suspense fallback={
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#4285f4] mx-auto"></div>
                      </div>
                    }>
                      <LoginForm />
                    </Suspense>

                    {/* Switch to Register */}
                    <div className="mt-6 text-center">
                      <p className="text-sm text-[#6c757d]">
                        Don't have an account?{' '}
                        <button
                          onClick={() => onSwitchMode('register')}
                          className="text-[#4285f4] hover:text-[#3367d6] font-bold transition-colors"
                        >
                          Create Free Account
                        </button>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Register Header */}
                    <div className="mb-6">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#34a853] to-[#137333] rounded-xl flex items-center justify-center">
                          <span className="text-2xl font-black text-white">SG</span>
                        </div>
                        <span className="text-2xl font-black text-[#343a40]">SellerGenix</span>
                      </div>
                      <h2 className="text-3xl font-black text-[#343a40] text-center mb-2">
                        Create Account
                      </h2>
                      <p className="text-[#6c757d] text-center">
                        Start your 14-day free trial today
                      </p>
                    </div>

                    {/* Register Form */}
                    <RegisterForm />

                    {/* Switch to Login */}
                    <div className="mt-6 text-center">
                      <p className="text-sm text-[#6c757d]">
                        Already have an account?{' '}
                        <button
                          onClick={() => onSwitchMode('login')}
                          className="text-[#4285f4] hover:text-[#3367d6] font-bold transition-colors"
                        >
                          Sign in instead
                        </button>
                      </p>
                    </div>

                    {/* Terms Notice */}
                    <div className="mt-4 text-center text-xs text-[#6c757d]">
                      <p>
                        By signing up, you agree to our{' '}
                        <a href="/terms" target="_blank" className="text-[#4285f4] hover:underline font-medium">
                          Terms of Service
                        </a>
                        {', '}
                        <a href="/privacy" target="_blank" className="text-[#4285f4] hover:underline font-medium">
                          Privacy Policy
                        </a>
                        {', and '}
                        <a href="/sales-agreement" target="_blank" className="text-[#4285f4] hover:underline font-medium">
                          Sales Agreement
                        </a>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
