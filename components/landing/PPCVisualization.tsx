'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const PPCVisualization = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const campaignData = [
    { name: 'Electronics Campaign', spend: '$2,400', sales: '$12,800', acos: '18.7%', status: 'active' },
    { name: 'Home & Garden', spend: '$1,800', sales: '$9,200', acos: '19.6%', status: 'active' },
    { name: 'Sports & Outdoors', spend: '$3,200', sales: '$14,900', acos: '21.5%', status: 'test' },
    { name: 'Beauty Products', spend: '$1,200', sales: '$7,400', acos: '16.2%', status: 'active' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="relative max-w-6xl mx-auto"
    >
      {/* PPC Dashboard */}
      <div className="relative bg-gradient-to-br from-gray-900/80 to-black/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-[0_32px_64px_rgba(0,0,0,0.5)] hover:border-white/30 hover:shadow-[0_40px_80px_rgba(0,0,0,0.7)] transition-all duration-700 group">
        {/* Premium Border Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-yellow-500/15 via-orange-500/15 to-red-500/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gradient-to-r from-transparent via-white/20 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center">
              <span className="text-white text-xl font-bold">⚡</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl bg-gradient-to-r from-white to-orange-200 bg-clip-text">PPC Campaign Manager</h2>
              <p className="text-gray-400 text-sm">AI-Powered Advertising Optimization</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-2xl shadow-lg shadow-orange-500/20">
            <span className="relative w-3 h-3">
              <span className="absolute inset-0 w-3 h-3 bg-orange-500 rounded-full animate-ping"></span>
              <span className="relative w-3 h-3 bg-orange-400 rounded-full"></span>
            </span>
            <span className="text-orange-300 text-sm font-semibold">AI Optimizing</span>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/30 border border-green-400/30 rounded-xl p-4"
          >
            <div className="text-green-300 text-sm font-medium mb-2">Total Ad Spend</div>
            <div className="text-white text-2xl font-bold">$8,600</div>
            <div className="text-green-400 text-sm mt-1">This Month</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-400/30 rounded-xl p-4"
          >
            <div className="text-blue-300 text-sm font-medium mb-2">Ad Revenue</div>
            <div className="text-white text-2xl font-bold">$44,300</div>
            <div className="text-blue-400 text-sm mt-1">ROAS: 5.15x</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 border border-purple-400/30 rounded-xl p-4"
          >
            <div className="text-purple-300 text-sm font-medium mb-2">Average ACoS</div>
            <div className="text-white text-2xl font-bold">19.4%</div>
            <div className="text-green-400 text-sm mt-1">↘ -3.2% vs last month</div>
          </motion.div>
        </div>

        {/* Campaign Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative bg-gradient-to-br from-white/10 to-white/20 border border-white/20 rounded-2xl p-6 mb-8 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30 transition-all duration-500 group"
        >
          {/* Chart Background Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/5 via-yellow-500/5 to-purple-500/5 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
          <h4 className="text-white font-medium mb-4">Campaign Performance Trends - 2025</h4>
          <div className="relative h-40">
            {/* Trend Lines */}
            <svg className="w-full h-full" viewBox="0 0 500 120">
              {/* Sales Revenue Line */}
              <motion.path
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.7 }}
                d="M 40 80 Q 120 65 200 50 T 460 25"
                stroke="#10b981"
                strokeWidth="3"
                fill="none"
                className="drop-shadow-lg"
              />
              {/* Ad Spend Line */}
              <motion.path
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.8 }}
                d="M 40 100 Q 120 95 200 80 T 460 65"
                stroke="#f59e0b"
                strokeWidth="3"
                fill="none"
                className="drop-shadow-lg"
              />
              {/* ACoS Line */}
              <motion.path
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.9 }}
                d="M 40 70 Q 120 75 200 65 T 460 55"
                stroke="#8b5cf6"
                strokeWidth="3"
                fill="none"
                className="drop-shadow-lg"
              />

              {/* Sales Revenue Data Points */}
              {[{x: 40, y: 80}, {x: 120, y: 65}, {x: 200, y: 50}, {x: 280, y: 40}, {x: 360, y: 30}, {x: 460, y: 25}].map((point, i) => (
                <motion.circle
                  key={`sales-${i}`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 1.0 + i * 0.1 }}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#10b981"
                  className="drop-shadow-lg"
                />
              ))}

              {/* Ad Spend Data Points */}
              {[{x: 40, y: 100}, {x: 120, y: 95}, {x: 200, y: 80}, {x: 280, y: 75}, {x: 360, y: 70}, {x: 460, y: 65}].map((point, i) => (
                <motion.circle
                  key={`spend-${i}`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 1.1 + i * 0.1 }}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#f59e0b"
                  className="drop-shadow-lg"
                />
              ))}

              {/* ACoS Data Points */}
              {[{x: 40, y: 70}, {x: 120, y: 75}, {x: 200, y: 65}, {x: 280, y: 62}, {x: 360, y: 58}, {x: 460, y: 55}].map((point, i) => (
                <motion.circle
                  key={`acos-${i}`}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="#8b5cf6"
                  className="drop-shadow-lg"
                />
              ))}
            </svg>

            {/* Month Labels */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-between text-xs text-gray-400 px-8">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>

            {/* Legend */}
            <div className="absolute bottom-2 left-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">Sales Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300">Ad Spend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-300">ACoS %</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Campaign List */}
        <div className="space-y-3">
          <h4 className="text-white font-medium mb-3">Active Campaigns</h4>
          {campaignData.map((campaign, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-white/5 to-white/10 border border-white/10 rounded-xl hover:from-white/10 hover:to-white/15 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  campaign.status === 'active' ? 'bg-green-500' :
                  campaign.status === 'test' ? 'bg-yellow-500' : 'bg-gray-500'
                } animate-pulse`}></div>
                <div>
                  <div className="text-white font-medium">{campaign.name}</div>
                  <div className="text-gray-400 text-sm">ACoS: {campaign.acos}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <div className="text-yellow-400 text-sm font-medium">{campaign.spend}</div>
                  <div className="text-gray-400 text-xs">Spend</div>
                </div>
                <div>
                  <div className="text-green-400 text-sm font-medium">{campaign.sales}</div>
                  <div className="text-gray-400 text-xs">Sales</div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs">⚡</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Animation Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-4 right-4 w-6 h-6 bg-yellow-500/30 rounded-full"
        />

        <motion.div
          animate={{
            y: [0, -15, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-4 left-4 w-4 h-4 bg-green-500/40 rounded-full"
        />
      </div>

      {/* Glowing Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 rounded-3xl blur-xl opacity-50 -z-10"></div>
    </motion.div>
  )
}

export default PPCVisualization