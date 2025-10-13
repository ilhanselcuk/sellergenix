'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const DashboardMockup = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="relative max-w-6xl mx-auto mt-16 mb-8"
    >
      {/* Dashboard Container */}
      <div className="relative bg-gradient-to-br from-gray-900/80 to-black/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4)] hover:border-white/30 hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)] transition-all duration-700 group">
        {/* Premium Border Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-500/20 via-success-500/20 to-primary-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gradient-to-r from-transparent via-white/20 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 via-primary-500 to-success-500 rounded-xl shadow-lg shadow-primary-500/30 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text">SellerGenix Dashboard</h2>
              <p className="text-gray-400 text-sm">Real-time Amazon Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/40 rounded-2xl shadow-lg shadow-green-500/20">
            <span className="relative w-3 h-3">
              <span className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
              <span className="relative w-3 h-3 bg-green-400 rounded-full"></span>
            </span>
            <span className="text-green-300 text-sm font-semibold">Live Data Stream</span>
          </div>
        </div>

        {/* Metrics Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="relative bg-gradient-to-br from-blue-500/30 to-blue-600/40 border border-blue-400/40 rounded-2xl p-6 hover:from-blue-500/40 hover:to-blue-600/50 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 hover:border-blue-400/60 transition-all duration-500 cursor-pointer group overflow-hidden"
          >
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
            <div className="text-blue-200 text-sm font-semibold mb-2 tracking-wide">Revenue</div>
            <div className="text-white text-2xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text">$24,847</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg">
                <span className="text-green-300 text-xs font-semibold">↗ +12.5%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="relative bg-gradient-to-br from-green-500/30 to-green-600/40 border border-green-400/40 rounded-2xl p-6 hover:from-green-500/40 hover:to-green-600/50 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 hover:border-green-400/60 transition-all duration-500 cursor-pointer group overflow-hidden"
          >
            <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse opacity-60"></div>
            <div className="text-green-200 text-sm font-semibold mb-2 tracking-wide">Orders</div>
            <div className="text-white text-2xl font-bold mb-2 bg-gradient-to-r from-white to-green-100 bg-clip-text">1,247</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg">
                <span className="text-green-300 text-xs font-semibold">↗ +8.3%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="relative bg-gradient-to-br from-purple-500/30 to-purple-600/40 border border-purple-400/40 rounded-2xl p-6 hover:from-purple-500/40 hover:to-purple-600/50 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 hover:border-purple-400/60 transition-all duration-500 cursor-pointer group overflow-hidden"
          >
            <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
            <div className="text-purple-200 text-sm font-semibold mb-2 tracking-wide">ACoS</div>
            <div className="text-white text-2xl font-bold mb-2 bg-gradient-to-r from-white to-purple-100 bg-clip-text">18.2%</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg">
                <span className="text-green-300 text-xs font-semibold">↘ -4.3%</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="relative bg-gradient-to-br from-amber-500/30 to-amber-600/40 border border-amber-400/40 rounded-2xl p-6 hover:from-amber-500/40 hover:to-amber-600/50 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/30 hover:border-amber-400/60 transition-all duration-500 cursor-pointer group overflow-hidden"
          >
            <div className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-pulse opacity-60"></div>
            <div className="text-amber-200 text-sm font-semibold mb-2 tracking-wide">Profit</div>
            <div className="text-white text-2xl font-bold mb-2 bg-gradient-to-r from-white to-amber-100 bg-clip-text">$8,124</div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg">
                <span className="text-green-300 text-xs font-semibold">↗ +15.7%</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Chart Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-4 hover:from-white/10 hover:to-white/15 hover:border-white/20 transition-all duration-300"
          >
            <h4 className="text-white font-medium mb-6">Sales Performance</h4>

            {/* Enhanced Bar Chart */}
            <div className="relative h-32 mb-4">
              <div className="flex items-end justify-between h-full gap-2">
                {[
                  { height: 75, color: 'from-blue-500 to-blue-600', label: 'M', value: '$3.2k' },
                  { height: 55, color: 'from-green-500 to-green-600', label: 'T', value: '$2.8k' },
                  { height: 90, color: 'from-purple-500 to-purple-600', label: 'W', value: '$4.1k' },
                  { height: 65, color: 'from-amber-500 to-amber-600', label: 'T', value: '$3.5k' },
                  { height: 95, color: 'from-cyan-500 to-cyan-600', label: 'F', value: '$4.7k' },
                  { height: 80, color: 'from-pink-500 to-pink-600', label: 'S', value: '$3.9k' },
                  { height: 85, color: 'from-emerald-500 to-emerald-600', label: 'S', value: '$4.2k' }
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 group relative">
                    {/* Value Tooltip */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      whileHover={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-md pointer-events-none z-10"
                    >
                      {bar.value}
                    </motion.div>

                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${bar.height}%`, opacity: 1 }}
                      transition={{ delay: 1.3 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                      className={`w-full bg-gradient-to-t ${bar.color} rounded-t-md shadow-lg group-hover:shadow-xl transition-all duration-300 relative overflow-hidden min-h-[8px]`}
                    >
                      {/* Shimmer Effect */}
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{
                          delay: 2 + i * 0.2,
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 3,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                      />

                      {/* Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-t ${bar.color} opacity-0 group-hover:opacity-60 transition-opacity duration-300 blur-sm`}></div>
                    </motion.div>

                    {/* Day Label */}
                    <span className="text-xs text-gray-400 mt-2 font-medium">{bar.label}</span>
                  </div>
                ))}
              </div>

              {/* Chart Grid Lines */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 2.5 }}
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ top: '20%' }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 2.7 }}
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
                style={{ top: '40%' }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 2.9 }}
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
                style={{ top: '60%' }}
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ delay: 3.1 }}
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ top: '80%' }}
              />
            </div>

            {/* Performance Indicators */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-400 font-medium">+18.5% vs last week</span>
              </div>
              <span className="text-gray-400">Peak: Friday</span>
            </div>
          </motion.div>

          {/* Product Performance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-gradient-to-br from-white/5 to-white/10 border border-white/10 rounded-xl p-4 hover:from-white/10 hover:to-white/15 hover:border-white/20 transition-all duration-300"
          >
            <h4 className="text-white font-medium mb-4">Products</h4>
            <div className="space-y-3">
              {[
                { asin: 'B08N5WRWNW', name: 'Wireless Bluetooth Headphones', sales: '$4,200', change: '+23%' },
                { asin: 'B09JNHQR1X', name: 'Silicone Phone Case Cover', sales: '$2,800', change: '+18%' },
                { asin: 'B07DC5PPFV', name: 'USB-C Charging Cable 6ft', sales: '$1,900', change: '+12%' }
              ].map((product, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 + i * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-md"></div>
                    <div>
                      <div className="text-gray-400 text-xs font-mono">{product.asin}</div>
                      <div className="text-gray-200 text-sm">{product.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm font-medium">{product.sales}</div>
                    <div className="text-green-400 text-xs">{product.change}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Floating Data Points */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
        />

        <motion.div
          animate={{
            y: [0, -8, 0],
            opacity: [0.5, 0.9, 0.5]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute top-10 -left-1 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"
        />

        <motion.div
          animate={{
            y: [0, -12, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-10 -right-1 w-2 h-2 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"
        />
      </div>

      {/* Glowing Background Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 via-success-500/20 to-primary-500/20 rounded-3xl blur-xl opacity-50 -z-10"></div>
    </motion.div>
  )
}

export default DashboardMockup