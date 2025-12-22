/**
 * Login Page - SellerGenix
 * Modern Google Material Design
 */

'use client'

import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { LoginForm } from '@/components/auth/LoginForm'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#4285f4] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#34a853] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#fbbc05] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#6c757d] hover:text-[#4285f4] mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Home</span>
          </Link>

          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block group">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4285f4] to-[#34a853] rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-black text-white">SG</span>
                </div>
                <span className="text-3xl font-black text-[#343a40]">SellerGenix</span>
              </div>
            </Link>
            <p className="text-[#6c757d] text-sm">
              AI-Powered Analytics for Amazon Excellence
            </p>
          </div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="bg-white/80 backdrop-blur-sm border-2 border-[#e5e7eb] rounded-2xl p-8 shadow-2xl"
          >
            <div className="mb-6">
              <h1 className="text-3xl font-black text-[#343a40] mb-2">Welcome Back</h1>
              <p className="text-[#6c757d]">
                Sign in to your account to continue
              </p>
            </div>

            <Suspense fallback={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#4285f4] mx-auto"></div>
              </div>
            }>
              <LoginForm />
            </Suspense>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e5e7eb]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#6c757d]">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Register Link */}
            <Link
              href="/auth/register"
              className="group block w-full text-center py-3 px-4 rounded-xl border-2 border-[#4285f4] text-[#4285f4] hover:bg-[#4285f4] hover:text-white transition-all duration-300 font-bold"
            >
              Create Free Account
            </Link>
          </motion.div>

          {/* Footer Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-6 text-center text-sm text-[#6c757d] space-x-4"
          >
            <Link href="/terms" className="hover:text-[#4285f4] transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-[#4285f4] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/sales-agreement" className="hover:text-[#4285f4] transition-colors">
              Sales Agreement
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#4285f4] transition-colors">
              Support
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
