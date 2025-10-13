'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import Link from 'next/link'
import ProfitVisualization from './ProfitVisualization'

const CTASection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-20 border-t border-white/5">
      {/* Profit Visualization Section */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
            True Profit Intelligence
          </h3>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            See your real profitability with all Amazon fees, advertising costs, and hidden charges calculated automatically.
          </p>
        </motion.div>

        <ProfitVisualization />
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="p-12 bg-white/[0.02] rounded-lg border border-white/5"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl font-bold mb-6 text-white"
          >
            Ready to Scale Your
            <span className="block mt-2 text-gray-400">
              Amazon Empire?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
          >
            Join enterprise clients who&apos;ve increased profit margins by 40% with our platform.
            Start your transformation today.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center justify-center gap-4 mb-8"
          >
            <div className="flex items-center justify-center gap-4">
              <Link href="/contact" className="px-8 py-3 bg-gradient-to-r from-primary-600 to-success-600 hover:from-primary-700 hover:to-success-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-500/50 hover:scale-105 transition-all duration-200">
                🚀 Start Enterprise Trial
              </Link>
              <Link href="/contact" className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 hover:scale-105 transition-all duration-200">
                📞 Book Demo Call
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Coming Q1 2026 &bull; Join waitlist to get early access
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-sm text-gray-500"
          >
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-2 animate-pulse" />
            No setup fees • Enterprise SLA • Dedicated success manager
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTASection