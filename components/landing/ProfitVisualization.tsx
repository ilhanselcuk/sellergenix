'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const ProfitVisualization = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const profitData = [
    { product: 'Wireless Headphones', revenue: 12800, cogs: 6400, amazonFees: 1920, adSpend: 1280, profit: 3200, margin: 25 },
    { product: 'Phone Case', revenue: 8600, cogs: 3440, amazonFees: 1290, adSpend: 860, profit: 3010, margin: 35 },
    { product: 'USB Cable', revenue: 5400, cogs: 2160, amazonFees: 810, adSpend: 540, profit: 1890, margin: 35 },
    { product: 'Screen Protector', revenue: 3200, cogs: 960, amazonFees: 480, adSpend: 320, profit: 1440, margin: 45 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="relative max-w-6xl mx-auto"
    >
      {/* Profit Intelligence Dashboard */}
      <div className="relative bg-gradient-to-br from-gray-900/85 to-black/95 backdrop-blur-2xl border border-white/25 rounded-3xl p-8 shadow-[0_32px_64px_rgba(0,0,0,0.6)] hover:border-white/35 hover:shadow-[0_40px_80px_rgba(0,0,0,0.8)] transition-all duration-700 group">
        {/* Premium Border Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gradient-to-r from-transparent via-white/25 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center">
              <span className="text-white text-xl font-bold">💰</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-xl bg-gradient-to-r from-white to-emerald-200 bg-clip-text">Profit Intelligence</h2>
              <p className="text-gray-400 text-sm">True Profitability Analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-500/25 to-green-500/25 border border-emerald-500/40 rounded-2xl shadow-lg shadow-emerald-500/25">
            <span className="relative w-3 h-3">
              <span className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="relative w-3 h-3 bg-emerald-400 rounded-full"></span>
            </span>
            <span className="text-emerald-300 text-sm font-semibold">True Profit Tracking</span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/30 border border-blue-400/30 rounded-xl p-4"
          >
            <div className="text-blue-300 text-xs font-medium mb-1">Total Revenue</div>
            <div className="text-white text-lg font-bold">$30,000</div>
            <div className="text-blue-400 text-xs">+18.5%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-red-500/20 to-red-600/30 border border-red-400/30 rounded-xl p-4"
          >
            <div className="text-red-300 text-xs font-medium mb-1">Total Costs</div>
            <div className="text-white text-lg font-bold">$20,460</div>
            <div className="text-red-400 text-xs">All fees included</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 border border-emerald-400/30 rounded-xl p-4"
          >
            <div className="text-emerald-300 text-xs font-medium mb-1">Net Profit</div>
            <div className="text-white text-lg font-bold">$9,540</div>
            <div className="text-emerald-400 text-xs">31.8% margin</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/30 border border-purple-400/30 rounded-xl p-4"
          >
            <div className="text-purple-300 text-xs font-medium mb-1">ROI</div>
            <div className="text-white text-lg font-bold">46.6%</div>
            <div className="text-purple-400 text-xs">vs investment</div>
          </motion.div>
        </div>

        {/* Profit Breakdown Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative bg-gradient-to-br from-white/15 to-white/25 border border-white/25 rounded-2xl p-6 mb-8 shadow-lg shadow-black/25 hover:shadow-xl hover:shadow-black/35 transition-all duration-500 group"
        >
          {/* Chart Background Glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/8 via-green-500/8 to-teal-500/8 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
          <h4 className="text-white font-medium mb-4">Product Profitability Analysis</h4>

          {/* Product Profit Bars */}
          <div className="space-y-4">
            {profitData.map((product, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{product.product}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-300">${product.revenue.toLocaleString()}</span>
                    <span className="text-emerald-400 font-medium">{product.margin}% margin</span>
                  </div>
                </div>

                {/* Profit Breakdown Bar */}
                <div className="relative h-6 bg-gray-800 rounded-lg overflow-hidden">
                  {/* Revenue base */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                    className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600"
                  />

                  {/* COGS */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(product.cogs / product.revenue) * 100}%` }}
                    transition={{ delay: 1.0 + i * 0.1, duration: 0.8 }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-600"
                  />

                  {/* Amazon Fees */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(product.amazonFees / product.revenue) * 100}%` }}
                    transition={{ delay: 1.2 + i * 0.1, duration: 0.8 }}
                    className="absolute inset-y-0 bg-gradient-to-r from-orange-500 to-orange-600"
                    style={{ left: `${(product.cogs / product.revenue) * 100}%` }}
                  />

                  {/* Ad Spend */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(product.adSpend / product.revenue) * 100}%` }}
                    transition={{ delay: 1.4 + i * 0.1, duration: 0.8 }}
                    className="absolute inset-y-0 bg-gradient-to-r from-yellow-500 to-yellow-600"
                    style={{ left: `${((product.cogs + product.amazonFees) / product.revenue) * 100}%` }}
                  />

                  {/* Profit */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(product.profit / product.revenue) * 100}%` }}
                    transition={{ delay: 1.6 + i * 0.1, duration: 0.8 }}
                    className="absolute inset-y-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span className="text-gray-300">COGS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-sm"></div>
              <span className="text-gray-300">Amazon Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
              <span className="text-gray-300">Ad Spend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
              <span className="text-gray-300">Net Profit</span>
            </div>
          </div>
        </motion.div>

        {/* Insights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border border-emerald-400/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-lg">💡</span>
              <span className="text-emerald-300 font-medium">AI Insight</span>
            </div>
            <p className="text-gray-200 text-sm">
              Screen Protectors show highest margin (45%). Consider increasing ad spend for better ROI optimization.
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-400/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-400 text-lg">📊</span>
              <span className="text-blue-300 font-medium">Performance Alert</span>
            </div>
            <p className="text-gray-200 text-sm">
              Overall profit margin increased by 8.3% this month. Amazon fees optimization working effectively.
            </p>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-6 right-6 w-4 h-4 bg-emerald-500/30 rounded-full"
        />

        <motion.div
          animate={{
            y: [0, -10, 0],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5
          }}
          className="absolute bottom-6 left-6 w-3 h-3 bg-green-500/40 rounded-full"
        />
      </div>

      {/* Glowing Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 rounded-3xl blur-xl opacity-50 -z-10"></div>
    </motion.div>
  )
}

export default ProfitVisualization