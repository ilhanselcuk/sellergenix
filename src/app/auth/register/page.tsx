/**
 * Register Page - SellerGenix
 * Premium Dark UI/UX with Glassmorphism
 */

'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { ArrowLeft, CheckCircle, Star, TrendingUp, Users, Award } from 'lucide-react'

export default function RegisterPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Neural network particle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
    }> = []

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      })
    }

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(52, 168, 83, ${p.opacity})`
        ctx.fill()

        particles.forEach((p2, j) => {
          if (i === j) return
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(52, 168, 83, ${0.1 * (1 - distance / 150)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] via-[#0a0f1c] to-[#0f172a] relative overflow-hidden">
      {/* Neural Network Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.6 }}
      />

      {/* Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#34a853] rounded-full filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-[#4285f4] rounded-full filter blur-[128px] opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo */}
            <Link href="/" className="inline-block group mb-12">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#34a853] via-emerald-600 to-[#137333] rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-[#34a853]/20">
                  <span className="text-3xl font-black text-white">SG</span>
                </div>
                <div>
                  <span className="text-4xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                    SellerGenix
                  </span>
                  <p className="text-gray-500 text-sm font-medium mt-1">
                    AI-Powered Analytics
                  </p>
                </div>
              </div>
            </Link>

            {/* Tagline */}
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight mb-6">
              Start Your{' '}
              <span className="bg-gradient-to-r from-[#34a853] via-emerald-500 to-[#137333] bg-clip-text text-transparent">
                Growth Journey
              </span>
            </h1>
            <p className="text-gray-400 text-lg mb-12 max-w-md">
              Join 10,000+ Amazon sellers who transformed their business with AI-powered analytics. Start your free trial today.
            </p>

            {/* Social Proof */}
            <div className="space-y-6">
              {[
                { icon: Users, text: '10,000+ Sellers', desc: 'Trust SellerGenix for their analytics' },
                { icon: TrendingUp, text: '+42% Avg Profit Increase', desc: 'Within first 3 months' },
                { icon: Star, text: '4.9/5 Rating', desc: 'Based on 2,500+ reviews' },
                { icon: Award, text: '#1 Analytics Tool', desc: 'Amazon Seller Community 2025' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#34a853]/50 transition-colors">
                    <item.icon className="w-6 h-6 text-[#34a853]" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{item.text}</p>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-16 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-block group">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#34a853] via-emerald-600 to-[#137333] rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg shadow-[#34a853]/20">
                    <span className="text-2xl font-black text-white">SG</span>
                  </div>
                  <span className="text-3xl font-black text-white">SellerGenix</span>
                </div>
              </Link>
              <p className="text-gray-400 text-sm mb-4">
                Start your 14-day free trial today
              </p>

              {/* Benefits - Mobile */}
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

            {/* Back to Home */}
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-[#34a853] mb-6 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to Home</span>
            </Link>

            {/* Register Card - Premium Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="relative"
            >
              {/* Gradient Border */}
              <div className="absolute -inset-[1px] bg-gradient-to-br from-[#34a853] via-emerald-600/50 to-[#137333] rounded-3xl opacity-50 blur-sm"></div>
              <div className="absolute -inset-[1px] bg-gradient-to-br from-[#34a853] via-emerald-600/50 to-[#137333] rounded-3xl"></div>

              {/* Card Content */}
              <div className="relative bg-[#0a0f1c]/90 backdrop-blur-xl rounded-3xl p-6 md:p-8">
                <div className="mb-6">
                  <h1 className="text-3xl font-black text-white mb-2">Create Account</h1>
                  <p className="text-gray-400">
                    Get started with SellerGenix for free
                  </p>
                </div>

                {/* Benefits - Desktop inside card */}
                <div className="hidden lg:flex items-center gap-4 mb-6 p-3 bg-gradient-to-r from-[#34a853]/10 to-emerald-600/10 border border-[#34a853]/20 rounded-xl">
                  <div className="flex items-center gap-2 text-[#34a853] text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">14-Day Free Trial</span>
                  </div>
                  <div className="w-px h-4 bg-white/10"></div>
                  <div className="flex items-center gap-2 text-[#34a853] text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">No Credit Card Required</span>
                  </div>
                </div>

                <RegisterForm />

                {/* Divider */}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#0a0f1c] text-gray-500">
                      Already have an account?
                    </span>
                  </div>
                </div>

                {/* Login Link */}
                <Link
                  href="/auth/login"
                  className="group block w-full text-center py-3.5 px-4 rounded-xl border border-white/20 text-white hover:bg-white/10 hover:border-[#34a853]/50 transition-all duration-300 font-bold"
                >
                  Sign in instead
                </Link>
              </div>
            </motion.div>

            {/* Footer Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-8 text-center text-xs text-gray-500"
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

            {/* Copyright */}
            <p className="mt-4 text-center text-xs text-gray-600">
              © 2025 SellerGenix. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
