'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const AnimatedBackground = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* 🌈 SUPER COLORFUL ANIMATED ORBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary Blue Orb */}
        <motion.div
          animate={{
            x: [0, 150, 0],
            y: [0, -120, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-br from-primary-500/60 via-blue-500/50 to-cyan-500/40 rounded-full blur-[120px]"
        />

        {/* Success Green Orb */}
        <motion.div
          animate={{
            x: [0, -120, 0],
            y: [0, 150, 0],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
          className="absolute bottom-0 left-0 w-[900px] h-[900px] bg-gradient-to-br from-success-500/60 via-green-500/50 to-emerald-500/40 rounded-full blur-[130px]"
        />

        {/* Warning Orange Orb */}
        <motion.div
          animate={{
            x: [0, 80, -80, 0],
            y: [0, -80, 80, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 7,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-warning-500/50 via-orange-500/40 to-yellow-500/40 rounded-full blur-[110px]"
        />

        {/* Purple Magic Orb */}
        <motion.div
          animate={{
            x: [0, -90, 90, 0],
            y: [0, 90, -90, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 12,
          }}
          className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/50 via-pink-500/40 to-red-500/30 rounded-full blur-[100px]"
        />

        {/* Teal Accent Orb */}
        <motion.div
          animate={{
            x: [0, 60, -60, 0],
            y: [0, -60, 60, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-teal-500/40 via-cyan-500/30 to-blue-500/30 rounded-full blur-[90px]"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </>
  )
}

export default AnimatedBackground