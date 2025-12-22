/**
 * Register Page - SellerGenix
 * Modern Google Material Design
 */

'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#34a853] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#4285f4] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#fbbc05] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#6c757d] hover:text-[#34a853] mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Home</span>
          </Link>

          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block group">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#34a853] to-[#137333] rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-black text-white">SG</span>
                </div>
                <span className="text-3xl font-black text-[#343a40]">SellerGenix</span>
              </div>
            </Link>
            <p className="text-[#6c757d] text-sm mb-4">
              Start your 14-day free trial today
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-[#34a853]">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">14-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2 text-[#34a853]">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">No Credit Card</span>
              </div>
            </div>
          </div>

          {/* Register Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm border-2 border-[#e5e7eb] rounded-2xl p-8 shadow-2xl"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-black text-[#343a40] mb-2">Create Account</h1>
              <p className="text-[#6c757d]">
                Get started with SellerGenix for free
              </p>
            </div>

            <RegisterForm />

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e5e7eb]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#6c757d]">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              href="/auth/login"
              className="group block w-full text-center py-3 px-4 rounded-xl border-2 border-[#4285f4] text-[#4285f4] hover:bg-[#4285f4] hover:text-white transition-all duration-300 font-bold"
            >
              Sign in instead
            </Link>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-center text-xs text-[#6c757d]"
          >
            <p>
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-[#4285f4] hover:underline font-medium">
                Terms of Service
              </Link>
              {', '}
              <Link href="/privacy" className="text-[#4285f4] hover:underline font-medium">
                Privacy Policy
              </Link>
              {', and '}
              <Link href="/sales-agreement" className="text-[#4285f4] hover:underline font-medium">
                Sales Agreement
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
