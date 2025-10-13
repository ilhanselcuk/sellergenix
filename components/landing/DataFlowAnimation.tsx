'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const DataFlowAnimation = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Data points that flow across the screen
  const dataPoints = [
    { id: 1, type: 'sales', value: '$1,247', delay: 0 },
    { id: 2, type: 'order', value: '47 orders', delay: 0.5 },
    { id: 3, type: 'profit', value: '+23%', delay: 1 },
    { id: 4, type: 'acos', value: '18.2%', delay: 1.5 },
    { id: 5, type: 'revenue', value: '$8,542', delay: 2 },
    { id: 6, type: 'clicks', value: '2.4k clicks', delay: 2.5 },
  ]

  const getDataPointColor = (type: string) => {
    switch (type) {
      case 'sales': return 'from-green-500 to-emerald-500'
      case 'order': return 'from-blue-500 to-cyan-500'
      case 'profit': return 'from-emerald-500 to-green-500'
      case 'acos': return 'from-purple-500 to-violet-500'
      case 'revenue': return 'from-yellow-500 to-orange-500'
      case 'clicks': return 'from-pink-500 to-rose-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Flowing Data Points */}
      {dataPoints.map((point) => (
        <motion.div
          key={point.id}
          initial={{
            x: -200,
            y: Math.random() * window.innerHeight,
            opacity: 0
          }}
          animate={{
            x: window.innerWidth + 200,
            y: Math.random() * window.innerHeight,
            opacity: [0, 0.6, 0.8, 0.6, 0]
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            delay: point.delay,
            repeat: Infinity,
            ease: "linear",
            repeatDelay: 3
          }}
          className={`absolute flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${getDataPointColor(point.type)} rounded-full text-white text-xs font-medium shadow-lg backdrop-blur-sm`}
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          {point.value}
        </motion.div>
      ))}

      {/* Neural Network Lines */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Animated connection lines */}
        {[...Array(8)].map((_, i) => (
          <motion.path
            key={i}
            d={`M ${Math.random() * 200} ${Math.random() * 100 + 100} Q ${Math.random() * 400 + 200} ${Math.random() * 200 + 200} ${Math.random() * 200 + 600} ${Math.random() * 100 + 400}`}
            stroke="url(#gradient)"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{
              duration: 8 + Math.random() * 4,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0085c3" stopOpacity="0" />
            <stop offset="50%" stopColor="#0085c3" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7ab800" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
            opacity: 0
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: -50,
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}

      {/* Corner Data Clusters */}
      <motion.div
        className="absolute top-20 right-20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-32 h-32 border border-primary-500/30 rounded-full flex items-center justify-center">
          <div className="w-20 h-20 border border-success-500/40 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-20 left-20"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      >
        <div className="w-24 h-24 border border-success-500/30 rounded-full flex items-center justify-center">
          <div className="w-16 h-16 border border-primary-500/40 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </motion.div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Pulsing Glow Effects */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0, 0.1, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle, rgba(0,133,195,0.3) 0%, rgba(0,133,195,0) 70%)'
        }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0, 0.08, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
        style={{
          background: 'radial-gradient(circle, rgba(122,184,0,0.3) 0%, rgba(122,184,0,0) 70%)'
        }}
      />
    </div>
  )
}

export default DataFlowAnimation