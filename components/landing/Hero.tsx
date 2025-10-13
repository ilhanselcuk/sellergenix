'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import DashboardMockup from './DashboardMockup'

const Hero = () => {
  const [mounted, setMounted] = useState(false)
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
    company: '',
    email: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Waitlist form:', formData)
    // TODO: Submit to backend
    setShowWaitlist(false)
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      country: '',
      company: '',
      email: ''
    })
    alert('Thank you! You have been added to our waitlist.')
  }


  if (!mounted) return null

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">SOC 2 Type II Certified • GDPR Compliant</span>
          </div>
        </motion.div>

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-7xl font-bold text-center mb-6 text-white"
        >
          The Analytics Platform
          <br />
          <span className="text-gray-500">Amazon Sellers Trust</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-gray-400 text-center max-w-3xl mx-auto mb-10"
        >
          Real-time data processing, ML-powered insights, and enterprise-grade security.
          Built for scale, designed for growth.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center mb-20"
        >
          <button
            onClick={() => setShowWaitlist(true)}
            className="px-12 py-4 bg-gradient-to-r from-primary-600 to-success-600 hover:from-primary-500 hover:to-success-500 text-white font-bold rounded-xl shadow-[0_12px_40px_rgba(0,133,195,0.4)] hover:shadow-[0_16px_50px_rgba(0,133,195,0.5)] hover:scale-105 transition-all duration-300 text-lg"
          >
            🚀 Join Waitlist
          </button>
        </motion.div>

        {/* Dashboard Mockup */}
        <DashboardMockup />

      </div>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Join Waitlist</h3>
              <button
                onClick={() => setShowWaitlist(false)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
              </div>

              <input
                type="email"
                placeholder="Email Address"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              />

              <input
                type="tel"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-primary-600 to-success-600 hover:from-primary-500 hover:to-success-500 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-all duration-200"
              >
                Send
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </section>
  )
}

export default Hero