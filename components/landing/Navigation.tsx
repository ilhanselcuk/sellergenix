'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])


  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-success-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-semibold text-white">SellerGenix</span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/features" className="text-sm text-white hover:text-primary-300 transition">Features</Link>
              <Link href="/pricing" className="text-sm text-white hover:text-primary-300 transition">Pricing</Link>
              <Link href="/contact" className="text-sm text-white hover:text-primary-300 transition">Contact</Link>
            </div>
          </div>

          {/* Right Nav */}
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-sm text-white hover:text-primary-300 transition font-medium">
              Contact Us
            </Link>
            <Link href="/contact" className="px-4 py-2 bg-gradient-to-r from-primary-600 to-success-600 hover:from-primary-500 hover:to-success-500 text-white text-sm font-semibold rounded-lg shadow-lg hover:scale-105 transition-all duration-200">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  )
}

export default Navigation