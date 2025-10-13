'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
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
              <button className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 font-semibold rounded-lg shadow-lg cursor-not-allowed opacity-60">
                🚀 Start Enterprise Trial
              </button>
              <button className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 font-semibold rounded-lg shadow-lg cursor-not-allowed opacity-60">
                📞 Book Demo Call
              </button>
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