'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import PPCVisualization from './PPCVisualization'

const enterpriseFeatures = [
  {
    title: "Real-Time Analytics",
    description: "Sub-second data processing with 99.99% uptime SLA. Monitor critical metrics across all marketplaces.",
    gradient: "from-blue-500/50 to-blue-600/70",
    border: "border-blue-400/60",
    accent: "text-blue-300"
  },
  {
    title: "ML-Powered Insights",
    description: "Advanced algorithms predict trends, optimize pricing, and identify growth opportunities automatically.",
    gradient: "from-green-500/50 to-green-600/70",
    border: "border-green-400/60",
    accent: "text-green-300"
  },
  {
    title: "Enterprise Security",
    description: "Bank-level encryption, SOC 2 compliance, and role-based access control for your entire organization.",
    gradient: "from-yellow-500/50 to-yellow-600/70",
    border: "border-yellow-400/60",
    accent: "text-yellow-300"
  },
  {
    title: "PPC Automation",
    description: "AI-driven bid management reduces ACoS by average 23% while scaling profitable campaigns.",
    gradient: "from-purple-500/50 to-purple-600/70",
    border: "border-purple-400/60",
    accent: "text-purple-300"
  },
  {
    title: "Profit Intelligence",
    description: "True profitability analysis including all fees, taxes, and hidden costs across your catalog.",
    gradient: "from-emerald-500/50 to-emerald-600/70",
    border: "border-emerald-400/60",
    accent: "text-emerald-300"
  },
  {
    title: "Smart Alerts",
    description: "Customizable notifications via Slack, email, or SMS for critical business events.",
    gradient: "from-cyan-500/50 to-cyan-600/70",
    border: "border-cyan-400/60",
    accent: "text-cyan-300"
  }
]

const Features = () => {
  const [ref] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section ref={ref} className="py-20 border-t border-white/5" id="features">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid md:grid-cols-3 gap-8">
          {enterpriseFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`p-8 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm rounded-lg border ${feature.border} hover:border-opacity-80 transition-all duration-300 relative overflow-hidden group shadow-lg`}
            >
              {/* Accent line */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.gradient.replace('/40', '/80').replace('/60', '/100')} opacity-70 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Animated dot */}
              <div className={`absolute top-4 right-4 w-2 h-2 ${feature.accent.replace('text-', 'bg-')} rounded-full animate-pulse`} />

              <h3 className="text-lg font-semibold mb-4 text-white">{feature.title}</h3>
              <p className="text-sm text-gray-200 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* PPC Visualization Section */}
        <div className="mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              AI-Powered PPC Optimization
            </h3>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Watch your campaigns optimize themselves in real-time with machine learning algorithms that reduce ACoS and maximize profitable growth.
            </p>
          </motion.div>

          <PPCVisualization />
        </div>
      </div>
    </section>
  )
}

export default Features