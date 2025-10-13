'use client'

import { motion } from 'framer-motion'

interface MetricsCardProps {
  label: string
  value: string
  change: number
  positive: boolean
  delay?: number
}

const MetricsCard = ({ label, value, change, positive, delay = 0 }: MetricsCardProps) => {
  const cardColors = [
    { border: 'border-primary-200', bg: 'bg-gradient-to-br from-primary-50 to-blue-50', accent: 'bg-primary-500' },
    { border: 'border-success-200', bg: 'bg-gradient-to-br from-success-50 to-green-50', accent: 'bg-success-500' },
    { border: 'border-warning-200', bg: 'bg-gradient-to-br from-warning-50 to-yellow-50', accent: 'bg-warning-500' },
    { border: 'border-purple-200', bg: 'bg-gradient-to-br from-purple-50 to-indigo-50', accent: 'bg-purple-500' }
  ]

  const cardIndex = Math.floor(delay * 10) % cardColors.length
  const colors = cardColors[cardIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -8 }}
      className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}
    >
      {/* Accent line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${colors.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* Animated dot */}
      <div className={`absolute top-3 right-3 w-2 h-2 ${colors.accent} rounded-full animate-pulse`} />

      <div className="text-gray-600 text-sm font-semibold mb-3 uppercase tracking-wider">
        {label}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-bold text-gray-900">
          {value}
        </span>
        <span
          className={`text-sm px-3 py-2 rounded-full font-bold shadow-md ${
            positive
              ? 'text-success-800 bg-success-200 border border-success-300'
              : 'text-danger-800 bg-danger-200 border border-danger-300'
          }`}
        >
          {positive ? '📈 +' : '📉 -'}{Math.abs(change)}%
        </span>
      </div>
    </motion.div>
  )
}

export default MetricsCard